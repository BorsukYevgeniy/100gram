import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Chat, ChatType, Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { UserNoCredVCode } from '../user/types/user.types';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
  }

  private async validateOwner(user: AccessTokenPayload, chatId: number) {
    this.logger.debug({ userId: user.id, chatId }, 'Validating chat owner');

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (chat.ownerId !== user.id && user.role !== Role.ADMIN) {
      this.logger.warn({ userId: user.id, chatId }, 'User is not chat owner');
      throw new ForbiddenException();
    }
  }

  private async validateChatType(chatId: number, expectedType: ChatType) {
    this.logger.debug({ chatId, expectedType }, 'Validating chat type');

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (chat.chatType !== expectedType) {
      this.logger.warn(
        { chatId, expectedType, actualType: chat.chatType },
        'Chat has invalid type',
      );
      throw new BadRequestException('Chat is not of type ${expectedType}');
    }
  }

  async validateChatParticipation(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<void> {
    this.logger.debug(
      { userId: user.id, chatId },
      'Validating chat participation',
    );

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (user.role === Role.ADMIN) {
      this.logger.debug(
        { userId: user.id, chatId },
        'Admin bypassed participation check',
      );
      return;
    }

    const usersInChat = await this.chatRepo.getUsersInChat(chatId);
    const isParticipant = usersInChat.some((u) => u.user.id === user.id);

    if (!isParticipant) {
      this.logger.warn(
        { userId: user.id, chatId },
        'User is not chat participant',
      );
      throw new ForbiddenException('User is not a participant of the chat');
    }
  }

  private async checkChatParticipation(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    this.logger.debug({ userId, chatId }, 'Checking chat participation');

    const usersInChat = await this.chatRepo.getUsersInChat(chatId);
    return usersInChat.some((u) => u.user.id === userId);
  }

  async createPrivateChat(
    userId: number,
    dto: CreatePrivateChatDto,
  ): Promise<Chat> {
    if (userId === dto.userId) {
      this.logger.warn(
        { userId },
        'Attempt to create private chat with yourself',
      );
      throw new BadRequestException('Cannot create private chat with yourself');
    }

    try {
      const chat = await this.chatRepo.createPrivateChat(userId, dto.userId);

      this.logger.info(
        { chatId: chat.id, userId, peerId: dto.userId },
        'Private chat created',
      );

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ peerId: dto.userId }, 'Peer user not found');
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async createGroupChat(
    ownerId: number,
    dto: CreateGroupChatDto,
  ): Promise<Chat> {
    try {
      const chat = await this.chatRepo.createGroupChat(ownerId, dto);

      this.logger.info(
        { chatId: chat.id, ownerId, users: dto.userIds },
        'Group chat created',
      );

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ users: dto.userIds }, 'One of users not found');
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async findById(user: AccessTokenPayload, chatId: number): Promise<Chat> {
    await this.validateChatParticipation(user, chatId);

    const chat: Chat | null = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    try {
      const chat = await this.chatRepo.updateGroupChat(id, dto);

      this.logger.info('Chat updated', {
        chatId: id,
        title: dto.title,
        description: dto.description,
      });
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId: id }, 'Chat not found');
        throw new NotFoundException('Chat not found');
      }
    }
  }

  async delete(user: AccessTokenPayload, chatId: number): Promise<Chat> {
    await this.validateOwner(user, chatId);

    try {
      const chat = await this.chatRepo.delete(chatId);

      this.logger.info({ chatId, deletedBy: user.id }, 'Chat deleted');

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId }, 'Chat not found');
        throw new NotFoundException('Chat not found');
      }
      throw e;
    }
  }

  async addUserToChat(chatId: number, userId: number) {
    await this.validateChatType(chatId, ChatType.GROUP);

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (isParticipant) {
      this.logger.warn({ chatId, userId }, 'User already in chat');
      throw new BadRequestException(
        'User already is a participant of the chat',
      );
    }

    const chatUser = await this.chatRepo.addUserToChat(chatId, userId);

    this.logger.info({ chatId, userId }, 'User added to chat');

    return chatUser;
  }

  async deleteUserFromChat(chatId: number, userId: number) {
    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn("Chat doesn't exists", { chatId });
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (!isParticipant) {
      this.logger.warn('User is not participant of the chat ', {
        userId,
        chatId,
      });
      throw new ForbiddenException('User is not a participant of the chat');
    }

    if (chat.chatType === ChatType.PRIVATE) {
      const chat = await this.chatRepo.delete(chatId);

      this.logger.info('Deleted chat', { chatId });
      return chat;
    } else if (chat.ownerId !== userId) {
      const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);

      this.logger.info('Deleted user from chat', { userId, chatId });
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

        this.logger.info('Updated owner in chat and deleted user from chat', {
          newOwnerId,
          chatId,
          userId,
        });
        return ownerAndChatUser;
      }

      const chat = await this.chatRepo.delete(chatId);

      this.logger.info('Deleted chat successfully', { chatId });
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

    this.logger.info('Updated owner in chat', { chatId, newOwnerId });
    return owner;
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    const { userId } = await this.chatRepo.findNewOwner(chatId, currentOnwerId);

    return userId;
  }
}
