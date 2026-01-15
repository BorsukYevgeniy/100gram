import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Chat, ChatType } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { ChatValidationService } from './validation/chat-validation.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
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
    await this.chatValidator.validateChatParticipation(user, chatId);

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
    await this.chatValidator.validateOwner(user, chatId);

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

  async updateOwner(chatId: number, newOwnerId: number): Promise<Chat> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);

    const owner = await this.chatRepo.updateOwner(chatId, newOwnerId);

    this.logger.info('Updated owner in chat', { chatId, newOwnerId });
    return owner;
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    const { userId } = await this.chatRepo.findNewOwner(chatId, currentOnwerId);

    return userId;
  }
}
