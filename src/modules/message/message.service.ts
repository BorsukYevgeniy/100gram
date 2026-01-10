import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { Message, Role } from '../../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './message.repository';
import { PaginatedMessages } from './types/paginated-messages.types';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessageService.name);
  }

  private async validateMessageOwnership(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    this.logger.debug(
      { userId: user.id, messageId },
      'Validating message ownership',
    );

    const message = await this.messageRepository.findById(messageId);

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

  async getMessagesInChat(
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedMessages> {
    const { cursor, limit } = paginationDto;

    const messages = await this.messageRepository.findMessagesInChat(
      chatId,
      limit,
      cursor,
    );

    this.logger.debug(
      {
        chatId,
        count: messages.length,
        limit,
        cursor,
      },
      'Fetched messages in chat',
    );

    const nextCursor = messages.length === limit ? messages.at(-1).id : null;
    const hasMore = messages.length === limit;

    return {
      messages,
      limit,
      nextCursor,
      hasMore,
    };
  }

  async create(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
  ): Promise<Message> {
    try {
      const message = await this.messageRepository.create(userId, chatId, dto);

      this.logger.info(
        { messageId: message.id, chatId, userId },
        'Message created',
      );

      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId }, 'Chat not found while creating message');
        throw new NotFoundException('Chat not found');
      }
      throw e;
    }
  }

  async findById(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    const message = await this.validateMessageOwnership(user, messageId);

    this.logger.debug({ messageId }, 'Fetched message');

    return message;
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);

    const message = await this.messageRepository.update(messageId, dto);

    this.logger.info({ messageId, updatedBy: user.id }, 'Message updated');

    return message;
  }

  async delete(user: AccessTokenPayload, messageId: number): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);

    const message = await this.messageRepository.delete(messageId);

    this.logger.info({ messageId, deletedBy: user.id }, 'Message deleted');

    return message;
  }
}
