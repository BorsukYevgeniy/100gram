import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Message, Role } from '../../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './message.repository';
import { PaginatedMessages } from './types/paginated-messages.types';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  private readonly logger = new Logger(MessageService.name);

  private async validateMessageOwnership(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    this.logger.log(
      `Validating ownership of message ID ${messageId} for user ID ${user.id}.`,
    );

    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      this.logger.warn(`Message with ID ${messageId} not found.`);
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== user.id && user.role !== Role.ADMIN) {
      this.logger.warn(
        `User with ID ${user.id} is not the owner of message ID ${messageId}.`,
      );

      throw new ForbiddenException(
        'You do not have permission to access this message',
      );
    }

    this.logger.log(
      `Validated ownership of message ${messageId} for user ${user.id} successfully`,
    );

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

    this.logger.log(
      `Fetched ${messages.length} for chat ${chatId} successfully`,
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

      this.logger.log(
        `Created message ${message.id} for user ${userId} in chat ${chatId}`,
      );
      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn(`Chat ${chatId} doesn't exists`);
        throw new NotFoundException('Chat not found');
      } else throw e;
    }
  }

  async findById(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    const message = await this.validateMessageOwnership(user, messageId);

    this.logger.log(`Fetched message ${messageId} successfully`);
    return message;
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    const message = await this.messageRepository.update(messageId, dto);

    this.logger.log(`Message ${messageId} updated successfully`);
    return message;
  }

  async delete(user: AccessTokenPayload, messageId: number): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    const message = await this.messageRepository.delete(messageId);

    this.logger.log(`Message ${messageId} deleted successfully`);
    return message;
  }
}
