import {
  PaginatedUserNoCredOtpVCode,
  UserNoCredOtpVCode,
} from '@app/contracts/user/types';
import { AccessTokenPayload } from '@app/contracts/auth';
import { ChatMemberResponseDto } from '@app/contracts/chat-member/dto';
import { UpdateRoleDto } from '@app/contracts/chat-member/dto/update-role.dto';
import { ChatMember } from '@app/contracts/chat-member/types/chat-member.types';
import { PaginationDto } from '@app/contracts/pagination';
import { UserPattern } from '@app/contracts/user/pattern';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { ChatType } from '../../../../generated/prisma/enums';
import { USER_CLIENT } from '../../../common/client/user-client.constants';
import { ChatValidationService } from '../validation/chat-validation.service';
import { ChatMemberRepository } from './repository/chat-member.repository';

@Injectable()
export class ChatMemberService {
  constructor(
    private readonly chatRepo: ChatMemberRepository,
    private readonly chatValidator: ChatValidationService,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    private readonly logger: PinoLogger,
  ) {}

  async addUserToChat(
    chatId: number,
    userId: number,
  ): Promise<ChatMemberResponseDto> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (isParticipant) {
      this.logger.warn({ chatId, userId }, 'User already in chat');
      throw new RpcException({
        message: 'User already is a participant of the chat',
        statusCode: 409,
      });
    }

    try {
      const [chatUser, membersCount] = await this.chatRepo.addUserToChat(
        chatId,
        userId,
      );

      this.logger.info({ chatId, userId }, 'User added to chat');

      return { ...chatUser, ...membersCount };
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId, userId }, 'User not found');
        throw new RpcException({ message: 'User not found', statusCode: 404 });
      }
      throw e;
    }
  }

  async deleteUserFromChat(
    chatId: number,
    userId: number,
    currentUser: AccessTokenPayload,
  ): Promise<ChatMemberResponseDto> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(currentUser, chatId);

    const [chatUser, memberCount] = await this.chatRepo.deleteUserFromChat(
      chatId,
      userId,
    );

    this.logger.info({ userId, chatId }, 'Deleted user from group chat');
    return { ...chatUser, ...memberCount };
  }

  async getUsersInChat(
    user: AccessTokenPayload,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    const { limit, cursor } = paginationDto;

    const users = await this.chatRepo.getUsersInChat(chatId, limit, cursor);
    const formattedUserIds = users.map(({ userId }) => userId);

    const formattedUsers = await Promise.all<UserNoCredOtpVCode>(
      formattedUserIds.map((userId) => {
        return firstValueFrom(
          this.userClient.send<UserNoCredOtpVCode, number>(
            UserPattern.GET_BY_ID,
            userId,
          ),
        );
      }),
    );

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
    { newRole }: UpdateRoleDto,
  ): Promise<ChatMember> {
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
      throw new RpcException({
        message: 'User is not a participant of the chat',
        statusCode: 404,
      });
    }

    const chatUser = await this.chatRepo.updateChatRole(
      chatId,
      userId,
      newRole,
    );

    this.logger.info({ chatId, userId, newRole }, 'Updated user role in chat');

    return chatUser;
  }
}

