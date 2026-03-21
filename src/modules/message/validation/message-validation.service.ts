import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatRole, Role } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { ChatRepository } from '../../chat/repository/chat.repository';
import { MessageRepository } from '../repository/message.repository';
import { MessageFiles } from '../types/message.types';

@Injectable()
export class MessageValidationService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly chatRepo: ChatRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageValidationService.name);
  }

  async validateMessageOwnership(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    this.logger.debug(
      { userId: user.id, messageId },
      'Validating message ownership',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== user.id && user.role !== Role.ADMIN) {
      this.logger.warn(
        { userId: user.id, messageId },
        'User is not message owner',
      );
      throw new ForbiddenException(
        'You do not have permission to access this message',
      );
    }

    return message;
  }

  async canDelete(user: AccessTokenPayload, messageId: number): Promise<void> {
    this.logger.debug(
      { userId: user.id, messageId },
      'Validating message deletion permissions',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    const chatRole = await this.chatRepo.getChatUser(message.chatId, user.id);

    const canDelete =
      message.userId === user.id ||
      user.role === Role.ADMIN ||
      chatRole.role !== ChatRole.MEMBER;

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }
  }
}
