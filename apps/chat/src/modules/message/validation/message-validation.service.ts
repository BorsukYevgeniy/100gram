import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  AccessTokenPayload,
  Roles,
} from '@app/contracts//auth';
import { Message } from '@app/contracts//message/types';
import { ChatRole } from '../../../../generated/prisma/enums';
import { ChatMemberRepository } from '../../chat/chat-member/repository/chat-member.repository';
import { MessageRepository } from '../repository/message.repository';

@Injectable()
export class MessageValidationService {
  constructor(
    private readonly messageRepo: MessageRepository,
    private readonly chatUserRepo: ChatMemberRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageValidationService.name);
  }

  async validateMessageOwnership(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    this.logger.debug(
      { userId: user.id, messageId },
      'Validating message ownership',
    );

    const message = await this.messageRepo.findById(messageId);

    if (!message) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== user.id && user.role !== Roles.ADMIN) {
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

    const chatRole = await this.chatUserRepo.getChatUser(
      message.chatId,
      user.id,
    );

    const canDelete =
      message.userId === user.id ||
      user.role === Roles.ADMIN ||
      chatRole.role !== ChatRole.MEMBER;

    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }
  }
}
