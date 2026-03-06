import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Chat, ChatType, Visibility } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { ChatRepository } from './repository/chat.repository';
import { ChatValidationService } from './validation/chat-validation.service';

import { randomBytes } from 'crypto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
  }

  private async generateInviteLink(): Promise<string> {
    return randomBytes(16).toString('hex');
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
      let inviteLink =
        dto.visibility === Visibility.PRIVATE
          ? await this.generateInviteLink()
          : undefined;

      const chat = await this.chatRepo.createGroupChat(
        ownerId,
        dto,
        inviteLink,
      );

      this.logger.info(
        {
          chatId: chat.id,
          ownerId,
          users: dto.userIds,
          Visibility: dto.visibility,
        },
        'Group chat created',
      );

      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ users: dto.userIds }, 'One of users not found');
        throw new NotFoundException('User not found');
      } else if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const newInviteLink = await this.generateInviteLink();
        this.logger.warn(
          { chatId: undefined, ownerId, attemptInviteLink: newInviteLink },
          'Invite link collision detected, retrying with new token',
        );

        const chat = await this.chatRepo.createGroupChat(
          ownerId,
          dto,
          newInviteLink,
        );

        this.logger.info(
          {
            chatId: chat.id,
            ownerId,
            users: dto.userIds,
            visibility: dto.visibility,
            inviteLink: newInviteLink,
          },
          'Group chat created successfully after resolving invite link collision',
        );

        return chat;
      }
      throw e;
    }
  }

  async addUserByInviteLink(user: AccessTokenPayload, inviteLink: string) {
    const chat = await this.chatRepo.getByInviteLink(inviteLink);

    if (!chat) {
      this.logger.warn({ inviteLink }, 'Chat with invite link not found');
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.chatValidator.checkChatParticipation(
      user.id,
      chat.id,
    );

    if (isParticipant) {
      this.logger.warn(
        { chatId: chat.id, userId: user.id },
        'User already in chat',
      );
      throw new BadRequestException(
        'User already is a participant of the chat',
      );
    }

    const chatUser = await this.chatRepo.addUserToChat(chat.id, user.id);

    this.logger.info(
      { chatId: chat.id, userId: user.id },
      'User added to chat via invite link',
    );

    return chatUser;
  }

  async updateInviteLink(user: AccessTokenPayload, chatId: number) {
    await this.chatValidator.validateOwner(user, chatId);

    return this.chatRepo.updateInviteLink(
      chatId,
      await this.generateInviteLink(),
    );
  }

  async findById(user: AccessTokenPayload, chatId: number): Promise<Chat> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    return this.chatRepo.getById(chatId);
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    try {
      const chat = await this.chatRepo.updateGroupChat(id, dto);

      this.logger.info(
        {
          chatId: id,
          title: dto.title,
          description: dto.description,
        },
        'Chat updated',
      );
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

    this.logger.info({ chatId, newOwnerId }, 'Updated owner in chat');
    return owner;
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    const { userId } = await this.chatRepo.findNewOwner(chatId, currentOnwerId);

    return userId;
  }
}
