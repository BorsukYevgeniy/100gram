import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatType, Role, Visibility } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { BlockedUserService } from '../../user/blocked-user/blocked-user.service';
import { ChatMemberRepository } from '../chat-member/repository/chat-member.repository';
import { ChatRepository } from '../repository/chat.repository';

@Injectable()
export class ChatValidationService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatUserRepo: ChatMemberRepository,
    private readonly blockedUserService: BlockedUserService,
    private readonly logger: PinoLogger,
  ) {}

  async validateOwner(user: AccessTokenPayload, chatId: number) {
    this.logger.debug({ userId: user.id, chatId }, 'Validating chat owner');

    const owner = await this.chatUserRepo.findChatOwner(chatId);

    if (!owner) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (owner.userId !== user.id && user.role !== Role.ADMIN) {
      this.logger.warn({ userId: user.id, chatId }, 'User is not chat owner');
      throw new ForbiddenException();
    }
  }

  async validateChatType(chatId: number, ...expectedTypes: ChatType[]) {
    this.logger.debug(
      { chatId, expectedType: expectedTypes },
      'Validating chat type',
    );

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (!expectedTypes.includes(chat.chatType)) {
      this.logger.warn(
        { chatId, expectedType: expectedTypes, actualType: chat.chatType },
        'Chat has invalid type',
      );
      throw new BadRequestException(`Chat is not of types ${expectedTypes}`);
    }
    return chat;
  }

  async validateChatVisibility(chatId: number, expectedVisibility: Visibility) {
    this.logger.debug(
      { chatId, expectedVisibility },
      'Validating chat visibility',
    );

    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn({ chatId }, 'Chat not found');
      throw new NotFoundException('Chat not found');
    }

    if (!expectedVisibility.includes(chat.visibility)) {
      this.logger.warn(
        { chatId, expectedVisibility, actualVisibilty: chat.visibility },
        'Chat has invalid visiblity',
      );
      throw new BadRequestException(
        `Chat is not of visibility ${expectedVisibility}`,
      );
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
      throw new ForbiddenException('User is not a participant of the chat');
    }

    if (user.role === Role.ADMIN) {
      this.logger.debug(
        { userId: user.id, chatId },
        'Admin bypassed participation check',
      );

      return chatToUser;
    }
  }

  async validateNotBlocked(userId: number, chatId: number) {
    const users = await this.chatUserRepo.getUserIdsInChat(chatId);

    const otherUserId = users.find(({ user }) => user.id !== userId).user.id;

    const isBlocked = await this.blockedUserService.isBlocked(
      userId,
      otherUserId,
    );

    if (isBlocked) {
      throw new ForbiddenException('You are blocked by this user');
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
