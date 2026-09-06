import { CreateGroupChatDto } from '@app/contracts/chat/dto/create-group-chat.dto';
import { CreatePrivateChatDto } from '@app/contracts/chat/dto/create-private-chat.dto';
import { UpdateGroupChatDto } from '@app/contracts/chat/dto/update-group-chat.dto';
import { Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Chat, ChatType, Visibility } from '../../../generated/prisma/client';
import { ChatRepository } from './repository/chat.repository';
import { ChatValidationService } from './validation/chat-validation.service';

import { randomBytes } from 'crypto';
import { ChatToUser } from '../../../generated/prisma/browser';
// import { CacheService } from '../cache/cache.service';
import { AccessTokenPayload } from '@app/contracts/auth';
import { ChatMember } from '@app/contracts/chat-member/types/chat-member.types';
import {
  ChannelGroupChatResponseDto,
  CreateChannelDto,
  PrivateChatResponseDto,
} from '@app/contracts/chat/dto';
import { PaginatedMyChats } from '@app/contracts/chat/types/chat.types';
import { PaginationDto } from '@app/contracts/pagination';
import { RpcException } from '@nestjs/microservices';
import { ChatMemberRepository } from './chat-member/repository/chat-member.repository';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatUserRepo: ChatMemberRepository,
    private readonly chatValidator: ChatValidationService,
    // private readonly cache: CacheService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatService.name);
  }

  private async generateInviteToken(): Promise<string> {
    return randomBytes(16).toString('hex');
  }

  async createChannel(dto: CreateChannelDto, ownerId: number) {
    const inviteToken =
      dto.visibility === Visibility.PRIVATE
        ? await this.generateInviteToken()
        : undefined;

    const channel = await this.chatRepo.createChannel(
      dto,
      ownerId,
      inviteToken,
    );

    this.logger.info(
      { channelId: channel.id, ownerId, visibility: channel.visibility },
      'Channel created',
    );

    return new ChannelGroupChatResponseDto(channel);
  }

  async createPrivateChat(
    userId: number,
    dto: CreatePrivateChatDto,
  ): Promise<PrivateChatResponseDto> {
    if (userId === dto.userId) {
      this.logger.warn(
        { userId },
        'Attempt to create private chat with yourself',
      );
      throw new RpcException({
        message: 'Cannot create private chat with yourself',
        statusCode: 400,
      });
    }

    try {
      const chat = await this.chatRepo.createPrivateChat(userId, dto.userId);

      this.logger.info(
        { chatId: chat.id, userId, peerId: dto.userId },
        'Private chat created',
      );

      return new PrivateChatResponseDto(chat);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ peerId: dto.userId }, 'Peer user not found');
        throw new RpcException({ message: 'User not found', statusCode: 404 });
      }
      throw e;
    }
  }

  async createGroupChat(
    ownerId: number,
    dto: CreateGroupChatDto,
  ): Promise<ChannelGroupChatResponseDto> {
    if (dto.userIds.includes(ownerId))
      throw new RpcException({
        statusCode: 409,
        message: 'Owner cannot be a member of the group chat',
      });

    try {
      const inviteToken =
        dto.visibility === Visibility.PRIVATE
          ? await this.generateInviteToken()
          : undefined;

      const chat = await this.chatRepo.createGroupChat(
        ownerId,
        dto,
        inviteToken,
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

      return new ChannelGroupChatResponseDto(chat);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ users: dto.userIds }, 'One of users not found');
        throw new RpcException({ message: 'User not found', statusCode: 404 });
      } else if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const newInviteToken = await this.generateInviteToken();
        this.logger.warn(
          { chatId: undefined, ownerId, attemptInviteToken: newInviteToken },
          'Invite token collision detected, retrying with new token',
        );

        const chat = await this.chatRepo.createGroupChat(
          ownerId,
          dto,
          newInviteToken,
        );

        this.logger.info(
          {
            chatId: chat.id,
            ownerId,
            users: dto.userIds,
            visibility: dto.visibility,
            inviteToken: newInviteToken,
          },
          'Group chat created successfully after resolving invite token collision',
        );

        return new ChannelGroupChatResponseDto(chat);
      }
      throw e;
    }
  }

  async addChatByInviteToken(
    user: AccessTokenPayload,
    inviteToken: string,
  ): Promise<ChatMember> {
    const chat = await this.chatRepo.getByinviteToken(inviteToken);

    if (!chat) {
      this.logger.warn({ inviteToken }, 'Chat with invite token not found');
      throw new RpcException({ message: 'Chat not found', statusCode: 404 });
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
      throw new RpcException({
        statusCode: 409,
        message: 'User already is a participant of the chat',
      });
    }

    const [chatMember, _] = await this.chatUserRepo.addUserToChat(
      chat.id,
      user.id,
    );

    this.logger.info(
      { chatId: chat.id, userId: user.id },
      'User added to chat via invite token',
    );

    return chatMember;
  }

  async updateInviteToken(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<Chat> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(user, chatId);

    return this.chatRepo.updateInviteToken(
      chatId,
      await this.generateInviteToken(),
    );
  }

  async findById(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    const chat = await this.chatRepo.getById(chatId);

    switch (chat.chatType) {
      case ChatType.PRIVATE:
        return new PrivateChatResponseDto(chat);
      case ChatType.GROUP:
        return new ChannelGroupChatResponseDto(chat);
      case ChatType.CHANNEL:
        return new ChannelGroupChatResponseDto(chat);
    }
  }

  async updateGroupChat(
    chatId: number,
    dto: UpdateGroupChatDto,
  ): Promise<ChannelGroupChatResponseDto> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    try {
      const chat = await this.chatRepo.updateGroupChat(chatId, dto);

      this.logger.info(
        {
          chatId,
          title: dto.title,
          description: dto.description,
        },
        'Chat updated',
      );
      return new ChannelGroupChatResponseDto(chat);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId }, 'Chat not found');
        throw new RpcException({ message: 'Chat not found', statusCode: 404 });
      }
    }
  }

  async delete(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    await this.chatValidator.validateOwner(user, chatId);

    try {
      const chat = await this.chatRepo.delete(chatId);

      this.logger.info({ chatId, deletedBy: user.id }, 'Chat deleted');

      switch (chat.chatType) {
        case ChatType.PRIVATE:
          return new PrivateChatResponseDto(chat);
        case ChatType.GROUP:
          return new ChannelGroupChatResponseDto(chat);
        case ChatType.CHANNEL:
          return new ChannelGroupChatResponseDto(chat);
      }
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId }, 'Chat not found');
        throw new RpcException({ message: 'Chat not found' });
      }
      throw e;
    }
  }

  async updateOwner(
    chatId: number,
    user: AccessTokenPayload,
    newOwnerId: number,
  ): Promise<ChatToUser> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(user, chatId);

    try {
      const owner = await this.chatUserRepo.updateOwner(chatId, newOwnerId);

      this.logger.info({ chatId, newOwnerId }, 'Updated owner in chat');
      return owner;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId, newOwnerId }, 'New owner not found');
        throw new RpcException({
          message: 'New owner not found',
          statusCode: 404,
        });
      }
      throw e;
    }
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    const { userId } = await this.chatUserRepo.findNewOwner(
      chatId,
      currentOnwerId,
    );

    return userId;
  }

  async getMyChats(
    userId: number,
    { limit, cursor }: PaginationDto,
  ): Promise<PaginatedMyChats> {
    // const cacheData = await this.cache.get<PaginatedMyChats>(
    //   this.cache.buildMyChatsKey(userId, { limit, cursor }),
    // );

    // if (cacheData) {
    //   this.logger.debug(
    //     { userId, limit, cursor },
    //     'My chats fetched from cache',
    //   );
    //   return cacheData;
    // }

    const chats = await this.chatRepo.getMyChats(userId, limit, cursor);

    const nextCursor = chats.length === limit ? chats.at(-1).id : null;
    const hasMore = chats.length === limit;

    const result = { limit, hasMore, nextCursor, chats };

    // await this.cache.set(
    //   this.cache.buildMyChatsKey(userId, { limit, cursor }),
    //   result,
    //   10,
    // );

    return result;
  }
}
