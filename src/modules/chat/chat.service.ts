import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat, ChatType, Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { UserNoCredVCode } from '../user/types/user.types';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly chatRepo: ChatRepository) {}

  private async validateOwner(user: AccessTokenPayload, chatId: number) {
    this.logger.log(`Validating owner for user ${user.id} in chat ${chatId}`);

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn(`Chat ${chatId} doesn't exists`);
      throw new NotFoundException('Chat not found');
    }

    if (chat.ownerId !== user.id || user.role !== Role.ADMIN) {
      this.logger.warn(`User ${user.id} doesn't owner of chat ${chatId}`);
      throw new ForbiddenException();
    }
  }

  private async validateChatType(chatId: number, expectedType: ChatType) {
    this.logger.log(`Validating chat type for chat ${chatId}`);
    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn(`Chat ${chatId} doesn't exists`);
      throw new NotFoundException('Chat not found');
    }

    if (chat.chatType !== expectedType) {
      this.logger.warn(`Chat ${chatId} is not of type ${expectedType}`);
      throw new BadRequestException(`Chat is not of type ${expectedType}`);
    }
  }

  async validateChatParticipation(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<void> {
    this.logger.log(
      `Validating chat particapation for user ${user.id} in chat ${chatId}`,
    );

    const chat: Chat | null = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn(`Chat ${chatId} doesn't exists`);
      throw new NotFoundException('Chat not found');
    }

    if (user.role === Role.ADMIN) {
      this.logger.log(`Validated chat participation for admin ${user.id}`);
      return;
    }

    const usersInChat = await this.chatRepo.getUsersInChat(chatId);

    const isParticipant = usersInChat.some((u) => u.user.id === user.id);

    if (!isParticipant) {
      this.logger.warn(
        `User ${user.id} is not participant of the chat ${chatId}`,
      );
      throw new ForbiddenException('User is not a participant of the chat');
    }
  }

  private async checkChatParticipation(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    this.logger.log(
      `Checking chat participation for user ${userId} in chat ${chatId}`,
    );
    const usersInChat = await this.chatRepo.getUsersInChat(chatId);

    return usersInChat.some((u) => u.user.id === userId);
  }

  async createPrivateChat(
    userId: number,
    createChatDto: CreatePrivateChatDto,
  ): Promise<Chat> {
    if (userId === createChatDto.userId) {
      this.logger.warn(`User ${userId} tries to create chat with yourself`);
      throw new BadRequestException('Cannot create private chat with yourself');
    }

    try {
      const chat = await this.chatRepo.createPrivateChat(
        userId,
        createChatDto.userId,
      );

      this.logger.log(
        `Created private chat with user ${userId} and user ${createChatDto.userId} successfully`,
      );

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn(`User ${createChatDto.userId} doesn't exists`);
        throw new NotFoundException('User not found');
      }
    }
  }

  async createGroupChat(
    ownerId: number,
    dto: CreateGroupChatDto,
  ): Promise<Chat> {
    try {
      const chat = await this.chatRepo.createGroupChat(ownerId, dto);
      this.logger.log(
        `Created group chat with users ${dto.userIds} by user ${ownerId} successfully `,
      );

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn(`One of users doesn't exists`);
        throw new NotFoundException('User not found');
      }
    }
  }

  async findById(user: AccessTokenPayload, chatId: number): Promise<Chat> {
    await this.validateChatParticipation(user, chatId);

    const chat: Chat | null = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn(`Chat ${chat.id} doescn't exists`);
      throw new NotFoundException('Chat not found');
    }

    this.logger.log(`Fetched chat ${chat.id} successfully`);
    return chat;
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    try {
      const chat = await this.chatRepo.updateGroupChat(id, dto);

      this.logger.log(`Chat ${id} updated successfully`);
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn(`Chat ${id} doesn't exists`);
        throw new NotFoundException('Chat not found');
      }
      throw e;
    }
  }

  async delete(user: AccessTokenPayload, id: number): Promise<Chat> {
    await this.validateOwner(user, id);

    try {
      const chat = await this.chatRepo.delete(id);

      this.logger.log(`Chat ${id} deleted successfully`);
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn(`Chat ${id} doesn't exists`);
        throw new NotFoundException('Chat not found');
      }
      throw e;
    }
  }

  async addUserToChat(chatId: number, userId: number) {
    await this.validateChatType(chatId, ChatType.GROUP);

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (isParticipant) {
      this.logger.warn(`User ${userId} already exists in chat ${chatId}`);
      throw new BadRequestException(
        'User already is a participant of the chat',
      );
    }

    const chatUser = await this.chatRepo.addUserToChat(chatId, userId);

    this.logger.log(`Added user ${userId} to chat ${chatId} successfully`);
    return chatUser;
  }

  async deleteUserFromChat(chatId: number, userId: number) {
    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn(`Chat ${chatId} doesn't exists`);
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (!isParticipant) {
      this.logger.warn(
        `User ${userId} is not participant of the chat ${chatId}`,
      );
      throw new ForbiddenException('User is not a participant of the chat');
    }

    if (chat.chatType === ChatType.PRIVATE) {
      const chat = await this.chatRepo.delete(chatId);

      this.logger.log(`Deleted chat ${chatId} successfully`);
      return chat;
    } else if (chat.ownerId !== userId) {
      const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);

      this.logger.log(
        `Deleted user ${userId} from chat ${chatId} successfully`,
      );
      return chatUser;
    } else {
      const { userId: newOwnerId } = await this.chatRepo.findNewOwner(
        chatId,
        userId,
      );

      if (newOwnerId) {
        const ownerAndChatUser = await this.chatRepo.updateOwnerAndDeleteUser(
          chatId,
          newOwnerId,
          userId,
        );

        this.logger.log(
          `Updated owner to user ${newOwnerId} on chat ${chatId} and deleted user ${userId} from chat ${chatId}`,
        );
        return ownerAndChatUser;
      }

      const chat = await this.chatRepo.delete(chatId);

      this.logger.log(`Deleted chat ${chat.id} successfully`);
      return chat;
    }
  }

  async getUserIdsInChat(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<{ users: UserNoCredVCode[] }> {
    await this.validateChatParticipation(user, chatId);

    const users = await this.chatRepo.getUsersInChat(chatId);

    return {
      users: users.map((u) => u.user),
    };
  }

  async updateOwner(chatId: number, newOwnerId: number): Promise<Chat> {
    await this.validateChatType(chatId, ChatType.GROUP);

    const owner = await this.chatRepo.updateOwner(chatId, newOwnerId);

    this.logger.log(`Updated owner to user ${newOwnerId} in chat ${chatId}`);
    return owner;
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    const { userId } = await this.chatRepo.findNewOwner(chatId, currentOnwerId);

    this.logger.log(`Getted new owner for chat ${chatId}`);

    return userId;
  }
}
