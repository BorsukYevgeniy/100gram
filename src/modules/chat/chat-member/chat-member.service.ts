import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { ChatType } from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { PaginatedUserNoCredOtpVCode } from '../../user/types/user.types';
import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { ChatValidationService } from '../validation/chat-validation.service';
import { ChatMemberRepository } from './repository/chat-member.repository';

@Injectable()
export class ChatMemberService {
  constructor(
    private readonly chatRepo: ChatMemberRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {}

  async addUserToChat(chatId: number, userId: number) {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);

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
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(currentUser, chatId);

    const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);
    this.logger.info({ userId, chatId }, 'Deleted user from group chat');
    return chatUser;
  }

  async getUsersInChat(
    user: AccessTokenPayload,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    const { limit, cursor } = paginationDto;

    const users = await this.chatRepo.getUsersInChat(chatId, limit, cursor);
    const formattedUsers = users.map(({ user }) => user);

    const nextCursor =
      formattedUsers.length === limit ? formattedUsers.at(-1).id : null;
    const hasMore = nextCursor !== null;

    this.logger.info(
      { chatId, userId: user.id, limit, nextCursor, hasMore },
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
    { role }: UpdateRoleDto,
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

    const chatUser = await this.chatRepo.updateChatRole(chatId, userId, role);

    this.logger.info(
      { chatId, userId, newRole: role },
      'Updated user role in chat',
    );

    return chatUser;
  }
}
