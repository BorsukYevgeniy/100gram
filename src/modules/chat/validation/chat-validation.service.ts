import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatType, Role } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { ChatRepository } from '../repository/chat.repository';

@Injectable()
export class ChatValidationService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly logger: PinoLogger,
  ) {}

  async validateOwner(user: AccessTokenPayload, chatId: number) {
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

  async validateChatType(chatId: number, expectedType: ChatType) {
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

    const usersInChat = await this.chatRepo.getUserIdsInChat(chatId);
    const isParticipant = usersInChat.some(({ user }) => user.id === user.id);

    if (!isParticipant) {
      this.logger.warn(
        { userId: user.id, chatId },
        'User is not chat participant',
      );
      throw new ForbiddenException('User is not a participant of the chat');
    }
  }

  async checkChatParticipation(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    this.logger.debug({ userId, chatId }, 'Checking chat participation');

    const usersInChat = await this.chatRepo.getUserIdsInChat(chatId);
    return usersInChat.some(({ user }) => user.id === userId);
  }
}
