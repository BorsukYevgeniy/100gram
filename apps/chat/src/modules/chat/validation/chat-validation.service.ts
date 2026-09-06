import { AccessTokenPayload, Roles } from '@app/contracts/auth';
import { BlockUserDto } from '@app/contracts/blocked-user/dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { BlockedUserPattern } from '@app/contracts/blocked-user/pattern';
import { ChatType } from '../../../../generated/prisma/enums';
import { USER_CLIENT } from '../../../common/client/user-client.constants';
import { ChatMemberRepository } from '../chat-member/repository/chat-member.repository';
import { ChatRepository } from '../repository/chat.repository';

@Injectable()
export class ChatValidationService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatUserRepo: ChatMemberRepository,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    private readonly logger: PinoLogger,
  ) {}

  async validateOwner(user: AccessTokenPayload, chatId: number) {
    this.logger.debug({ userId: user.id, chatId }, 'Validating chat owner');

    const owner = await this.chatUserRepo.findChatOwner(chatId);

    // if (!chat) {
    //   this.logger.warn({ chatId }, 'Chat not found');
    //   throw new NotFoundException('Chat not found');
    // }

    if (owner.userId !== user.id && user.role !== Roles.ADMIN) {
      this.logger.warn({ userId: user.id, chatId }, 'User is not chat owner');
      throw new RpcException({
        statusCode: 403,
        message: 'User is not chat owner',
      });
    }
  }

  async validateChatType(chatId: number, expectedType: ChatType) {
    this.logger.debug({ chatId, expectedType }, 'Validating chat type');

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new RpcException({ message: 'Chat not found', statusCode: 404 });
    }

    if (chat.chatType !== expectedType) {
      this.logger.warn(
        { chatId, expectedType, actualType: chat.chatType },
        'Chat has invalid type',
      );
      throw new RpcException({
        statusCode: 400,
        message: `Chat is not of type ${expectedType}`,
      });
    }
    return chat;
  }

  async validateChatParticipation(user: AccessTokenPayload, chatId: number) {
    this.logger.debug(
      { userId: user.id, chatId },
      'Validating chat participation',
    );

    const chatToUser = await this.chatUserRepo.getChatUser(chatId, user.id);

    if (!chatToUser) {
      this.logger.warn(
        { userId: user.id, chatId },
        'User is not a participant of the chat',
      );
      throw new RpcException({
        statusCode: 403,
        message: 'User is not a participant of the chat',
      });
    }

    if (user.role === Roles.ADMIN) {
      this.logger.debug(
        { userId: user.id, chatId },
        'Admin bypassed participation check',
      );

      return chatToUser;
    }
  }

  async validateNotBlocked(userId: number, chatId: number) {
    const users = await this.chatUserRepo.getUserIdsInChat(chatId);

    const otherUserId = users.find(
      ({ userId: participantId }) => participantId !== userId,
    ).userId;

    const isBlocked = await firstValueFrom(
      this.userClient.send<boolean, BlockUserDto>(
        BlockedUserPattern.IS_BLOCKED,
        { blockerId: userId, blockedId: otherUserId },
      ),
    );

    if (isBlocked) {
      throw new RpcException({
        statusCode: 403,
        message: 'You are blocked by this user',
      });
    }
  }

  async checkChatParticipation(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    this.logger.debug({ userId, chatId }, 'Checking chat participation');

    const usersInChat = await this.chatUserRepo.getChatUser(chatId, userId);
    return !!usersInChat;
  }
}


