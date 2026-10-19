import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatRole, Role } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { ChatMemberRepository } from '../../chat/chat-member/repository/chat-member.repository';
import { MessageMapperService } from '../mapper/message-mapper.service';
import { MessageRepository } from '../repository/message.repository';
import { MessageFiles } from '../types/message.types';

@Injectable()
export class MessageValidationService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly chatUserRepo: ChatMemberRepository,
    private readonly logger: PinoLogger,
    private readonly mapper: MessageMapperService,
  ) {
    this.logger.setContext(MessageValidationService.name);
  }

  async validateMessageOwnership(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    this.logger.debug(
      { userId: user.userId, messageId },
      'Validating message ownership',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== user.userId && user.role !== Role.ADMIN) {
      this.logger.warn(
        { userId: user.userId, messageId },
        'User is not message owner',
      );
      throw new ForbiddenException(
        'You do not have permission to access this message',
      );
    }

    return this.mapper.toMessageFile(message);
  }

  async canUpdate(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    this.logger.debug(
      { userId: user.userId, messageId },
      'Validating message ownership',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== user.userId) {
      this.logger.warn(
        { userId: user.userId, messageId },
        'User is not message owner',
      );
      throw new ForbiddenException(
        'You do not have permission to access this message',
      );
    }

    return this.mapper.toMessageFile(message);
  }

  async canDelete(user: AccessTokenPayload, messageId: number): Promise<void> {
    this.logger.debug(
      { userId: user.userId, messageId },
      'Validating message deletion permissions',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    const chatRole = await this.chatUserRepo.getChatUser(
      message.chatId,
      user.userId,
    );

    const canDelete =
      message.userId === user.userId ||
      user.role === Role.ADMIN ||
      chatRole.role !== ChatRole.MEMBER;

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }
  }
}
