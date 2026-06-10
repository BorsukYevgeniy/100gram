import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { ChatType } from '../../../generated/prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { CacheService } from '../cache/cache.service';
import { ChatRepository } from '../chat/repository/chat.repository';
import { FileService } from '../file/file.service';
import { BlockedUserService } from '../user/blocked-user/blocked-user.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './repository/message.repository';
import { MessageFiles, PaginatedMessageFiles } from './types/message.types';
import { MessageValidationService } from './validation/message-validation.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly chatRepo: ChatRepository,
    private readonly fileService: FileService,
    private readonly blockedUserService: BlockedUserService,
    private readonly messageValidator: MessageValidationService,
    private readonly logger: PinoLogger,
    private readonly cache: CacheService,
  ) {
    this.logger.setContext(MessageService.name);
  }

  private async checkBlock(userId: number, chatId: number) {
    const { chatType } = await this.chatRepo.getById(chatId);

    if (chatType !== ChatType.PRIVATE) return;

    const users = await this.chatRepo.getUserIdsInChat(chatId);

    const otherUserId = users.find(({ user }) => user.id !== userId).user.id;

    const isBlocked = await this.blockedUserService.isBlocked(
      userId,
      otherUserId,
    );

    if (isBlocked) {
      throw new ForbiddenException('You are blocked by this user');
    }
  }

  async getMessagesInChat(
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedMessageFiles> {
    const { cursor, limit } = paginationDto;

    const chatMessageVersion = await this.cache.getChatMessageVersion(chatId);
    const cacheData = await this.cache.get<PaginatedMessageFiles>(
      this.cache.buildChatMessageKey(chatId, chatMessageVersion, paginationDto),
    );

    if (cacheData) {
      this.logger.debug({ chatId }, 'Messages in chat fetched from cache');
      return cacheData;
    }

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

    const result = {
      messages,
      limit,
      nextCursor,
      hasMore,
    };

    await this.cache.set(
      this.cache.buildChatMessageKey(chatId, chatMessageVersion, paginationDto),
      result,
      60,
    );

    return result;
  }

  async create(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    files: Express.Multer.File[],
  ): Promise<MessageFiles> {
    await this.checkBlock(userId, chatId);

    try {
      const createdFiles = await this.fileService.createFiles(files, userId);

      const fileIds = createdFiles.map(({ id }) => id);

      const message = await this.messageRepository.create(
        userId,
        chatId,
        dto,
        fileIds,
      );

      this.logger.info(
        {
          messageId: message.id,
          chatId,
          userId,
          fileIds,
          provider: 'http',
        },
        'Message created via REST API',
      );

      await this.cache.incrChatMessageVersion(chatId);

      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId }, 'Chat not found while creating message');
        throw new NotFoundException('Chat not found');
      }
      throw e;
    }
  }

  async createFromWs(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    fileIds: number[],
  ): Promise<MessageFiles> {
    await this.checkBlock(userId, chatId);

    try {
      const message = await this.messageRepository.create(
        userId,
        chatId,
        dto,
        fileIds,
      );

      this.logger.info(
        {
          messageId: message.id,
          chatId,
          userId,
          fileIds,
          provider: 'ws',
        },
        'Message created via WS',
      );
      await this.cache.incrChatMessageVersion(chatId);
      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId }, 'Chat not found while creating message');
        throw new NotFoundException('Chat not found');
      } else if (
        e instanceof PrismaClientKnownRequestError &&
        e.code === 'P2018'
      ) {
        this.logger.warn({ fileIds }, 'Files not found while creating message');
        throw new NotFoundException('Files not found');
      } else {
        throw e;
      }
    }
  }

  async findById(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    return this.messageValidator.validateMessageOwnership(user, messageId);
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
    files: Express.Multer.File[],
  ): Promise<MessageFiles> {
    await this.messageValidator.validateMessageOwnership(user, messageId);

    const createdFiles = await this.fileService.createFiles(
      files,
      user.id,
      messageId,
    );

    const message = await this.messageRepository.update(
      messageId,
      dto,
      createdFiles.map(({ id }) => id),
    );

    this.logger.info(
      { messageId, updatedBy: user.id, provider: 'http' },
      'Message updated via REST API',
    );
    await this.cache.incrChatMessageVersion(message.chatId);
    return message;
  }

  async updateFromWs(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
    fileIds: number[],
  ): Promise<MessageFiles> {
    await this.messageValidator.validateMessageOwnership(user, messageId);

    try {
      const message = await this.messageRepository.update(
        messageId,
        dto,
        fileIds,
      );

      this.logger.info(
        { messageId, updatedBy: user.id, provider: 'ws' },
        'Message updated via WS',
      );

      await this.cache.incrChatMessageVersion(message.chatId);
      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2018') {
        this.logger.warn({ fileIds }, 'Files not found while creating message');
        throw new NotFoundException('Files not found');
      }
    }
  }

  async delete(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    await this.messageValidator.canDelete(user, messageId);

    const message = await this.messageRepository.delete(messageId);

    this.logger.info({ messageId, deletedBy: user.id }, 'Message deleted');

    await this.cache.incrChatMessageVersion(message.chatId);
    return message;
  }
}
