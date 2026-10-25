import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import {
  ChatRole,
  ChatType,
  Visibility,
} from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { ChatValidationService } from '../validation/chat-validation.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChatMemberRepository } from './repository/chat-member.repository';
import {
  ChatMemberWithRole,
  PaginatedChatMembers,
} from './types/chat-member.types';

@Injectable()
export class ChatMemberService {
  constructor(
    private readonly chatRepo: ChatMemberRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {}

  async addUserToChat(
    user: AccessTokenPayload,
    chatId: number,
    userId: number,
  ) {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.GROUP,
      ChatType.CHANNEL,
    );
    await this.chatValidator.validateOwner(user, chatId);

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (isParticipant) {
      this.logger.warn({ chatId, userId }, 'User already in chat');
      throw new ConflictException('User already is a participant of the chat');
    }

    try {
      const chatUser = await this.chatRepo.addUserToChat(chatId, userId);

      this.logger.info({ chatId, userId }, 'User added to chat');

      return chatUser;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId, userId }, 'User not found');
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async deleteUserFromChat(
    chatId: number,
    userId: number,
    currentUser: AccessTokenPayload,
  ) {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.GROUP,
      ChatType.CHANNEL,
    );
    await this.chatValidator.validateOwner(currentUser, chatId);

    try {
      const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);

      this.logger.info({ userId, chatId }, 'Deleted user from group chat');
      return chatUser;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ chatId, userId }, 'User not found');
        throw new NotFoundException('User is not a participant of the chat');
      }
      throw e;
    }
  }

  async getUsersInChat(
    userId: number,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedChatMembers> {
    await this.chatValidator.validateChatParticipation(userId, chatId);

    const { limit, cursor } = paginationDto;

    const users = await this.chatRepo.getUsersInChat(chatId, limit, cursor);
    const formattedUsers: ChatMemberWithRole[] = users.map(
      ({ role, user }) => ({
        id: user.id,
        avatarName: user.avatarName,
        nickname: user.nickname,
        chatRole: role as ChatRole,
      }),
    );

    const nextCursor =
      formattedUsers.length === limit ? formattedUsers.at(-1).id : null;
    const hasMore = nextCursor !== null;

    this.logger.info(
      { chatId, userId, limit, nextCursor, hasMore },
      'Fetched users in chat',
    );

    return {
      users: formattedUsers,
      nextCursor,
      limit,
      hasMore,
    };
  }

  async updateUserChatRole(
    currentUser: AccessTokenPayload,
    chatId: number,
    userId: number,
    dto: UpdateRoleDto,
  ) {
    await this.chatValidator.validateOwner(currentUser, chatId);

    const participation = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (!participation) {
      this.logger.warn(
        { chatId, userId },
        'User is not a participant of the chat',
      );
      throw new NotFoundException('User is not a participant of the chat');
    }

    const chatUser = await this.chatRepo.updateChatRole(chatId, userId, dto);

    this.logger.info(
      { chatId, userId, newRole: dto.role },
      'Updated user role in chat',
    );

    return chatUser;
  }

  async leaveChat(chatId: number, userId: number) {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.CHANNEL,
      ChatType.GROUP,
    );
    await this.chatValidator.validateChatParticipation(userId, chatId);

    const user = await this.chatRepo.deleteUserFromChat(chatId, userId);

    this.logger.info({ chatId, userId }, 'User leaved chat');

    return user;
  }

  async joinToChat(chatId: number, userId: number) {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.GROUP,
      ChatType.CHANNEL,
    );

    await this.chatValidator.validateChatVisibility(chatId, Visibility.PUBLIC);

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (isParticipant) {
      this.logger.warn({ chatId, userId }, 'User already in chat');
      throw new ConflictException('User already is a participant of the chat');
    }

    const chatToUser = await this.chatRepo.addUserToChat(chatId, userId);

    this.logger.info({ chatId, userId }, 'User joined to public chat');

    return chatToUser;
  }
}
