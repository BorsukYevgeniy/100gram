import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { CreateMessageDto } from '@app/contracts/message/dto/create-message.dto';
import { UpdateMessageDto } from '@app/contracts/message/dto/update-message.dto';
import { ChatType } from '../../../generated/prisma/enums';
// import { CacheService } from '../cache/cache.service';
import { ChatRepository } from '../chat/repository/chat.repository';
import { ChatValidationService } from '../chat/validation/chat-validation.service';
// import { FileService } from '../file/file.service';
import { AccessTokenPayload } from '@app/contracts/auth';
import { PaginationDto } from '@app/contracts/pagination';
import { MessageRepository } from './repository/message.repository';
import { MessageValidationService } from './validation/message-validation.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly messageRepository: MessageRepository,
    // private readonly fileService: FileService,
    private readonly messageValidator: MessageValidationService,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
    // private readonly cache: CacheService,
  ) {
    this.logger.setContext(MessageService.name);
  }

  async getMessagesInChat(
    chatId: number,
    paginationDto: PaginationDto,
    // ): Promise<PaginatedMessageFiles> {
  ) {
    const { cursor, limit } = paginationDto;

    // const chatMessageVersion = await this.cache.getChatMessageVersion(chatId);
    // const cacheData = await this.cache.get<PaginatedMessageFiles>(
    //   this.cache.buildChatMessageKey(chatId, chatMessageVersion, paginationDto),
    // );

    // if (cacheData) {
    //   this.logger.debug({ chatId }, 'Messages in chat fetched from cache');
    //   return cacheData;
    // }

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

    // await this.cache.set(
    //   this.cache.buildChatMessageKey(chatId, chatMessageVersion, paginationDto),
    //   result,
    //   60,
    // );

    return result;
  }

  async create(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    _files: Express.Multer.File[],
    // ): Promise<MessageFiles> {
  ) {
    // const createdFiles = await this.fileService.createFiles(files, userId);

    return this.createInternal(
      userId,
      chatId,
      dto,
      // createdFiles.map(({ id }) => id),
      'http',
    );
  }

  async createFromWs(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    // fileIds: number[],
    // ): Promise<MessageFiles> {
  ) {
    return this.createInternal(userId, chatId, dto, /*fileIds*/ 'ws');
  }

  private async createInternal(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    // fileIds: number[],
    provider: 'http' | 'ws',
    // ): Promise<MessageFiles> {
  ) {
    const { chatType } = await this.chatRepo.findChatType(chatId);

    if (chatType === ChatType.PRIVATE)
      await this.chatValidator.validateNotBlocked(userId, chatId);

    try {
      const message = await this.messageRepository.create(
        userId,
        chatId,
        dto,
        // fileIds,
      );

      this.logger.info(
        {
          messageId: message.id,
          chatId,
          userId,
          // fileIds,
          provider,
        },
        'Message created',
      );

      // await this.cache.incrChatMessageVersion(chatId);

      return message;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          // case 'P2018':
          //   if (provider === 'ws') {
          //     this.logger.warn(
          //       { fileIds },
          //       'Files not found while creating message',
          //     );
          //     throw new NotFoundException('Files not found');
          //   }
          //   break;

          case 'P2025':
            this.logger.warn(
              { replyId: dto.replyId },
              'Reply message not found while creating message',
            );
            throw new NotFoundException('Reply message not found');
        }
      }

      throw e;
    }
  }

  async findById(
    user: AccessTokenPayload,
    messageId: number,
    // ): Promise<MessageFiles> {
  ) {
    return this.messageValidator.validateMessageOwnership(user, messageId);
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
    _files: Express.Multer.File[],
    // ): Promise<MessageFiles> {
  ) {
    // const createdFiles = await this.fileService.createFiles(
    //   files,
    //   user.id,
    //   messageId,
    // );

    return this.updateInternal(
      user,
      messageId,
      dto,
      // createdFiles.map(({ id }) => id),
      'http',
    );
  }

  async updateFromWs(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
    // fileIds: number[],
    // ): Promise<MessageFiles> {
  ) {
    return this.updateInternal(user, messageId, dto, /*fileIds,*/ 'ws');
  }

  private async updateInternal(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
    // fileIds: number[],
    transport: 'http' | 'ws',
  ) {
    await this.messageValidator.validateMessageOwnership(user, messageId);

    try {
      const message = await this.messageRepository.update(
        messageId,
        dto,
        // fileIds,
      );

      this.logger.info(
        { messageId, updatedBy: user.id, transport },
        'Message updated',
      );

      // await this.cache.incrChatMessageVersion(message.chatId);
      return message;
    } catch (e) {
      // if (e instanceof PrismaClientKnownRequestError && e.code === 'P2018') {
      //   this.logger.warn({ fileIds }, 'Files not found while updating message');
      //   throw new NotFoundException('Files not found');
      // }
      // throw e;
    }
  }

  async delete(
    user: AccessTokenPayload,
    messageId: number,
    // ): Promise<MessageFiles> {
  ) {
    await this.messageValidator.canDelete(user, messageId);

    const message = await this.messageRepository.delete(messageId);

    this.logger.info({ messageId, deletedBy: user.id }, 'Message deleted');

    // await this.cache.incrChatMessageVersion(message.chatId);
    return message;
  }
}
