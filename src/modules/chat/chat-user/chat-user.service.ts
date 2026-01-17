import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatType } from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { PaginatedUserNoCredVCode } from '../../user/types/user.types';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

export class ChatUserService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {}

  async addUserToChat(chatId: number, userId: number) {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (isParticipant) {
      this.logger.warn({ chatId, userId }, 'User already in chat');
      throw new BadRequestException(
        'User already is a participant of the chat',
      );
    }

    const chatUser = await this.chatRepo.addUserToChat(chatId, userId);

    this.logger.info({ chatId, userId }, 'User added to chat');

    return chatUser;
  }

  async deleteUserFromChat(chatId: number, userId: number) {
    const chat = await this.chatRepo.getById(chatId);

    if (!chat) {
      this.logger.warn("Chat doesn't exists", { chatId });
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (!isParticipant) {
      this.logger.warn('User is not participant of the chat ', {
        userId,
        chatId,
      });
      throw new ForbiddenException('User is not a participant of the chat');
    }

    if (chat.chatType === ChatType.PRIVATE) {
      const chat = await this.chatRepo.delete(chatId);

      this.logger.info('Deleted chat', { chatId });
      return chat;
    } else if (chat.ownerId !== userId) {
      const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);

      this.logger.info('Deleted user from chat', { userId, chatId });
      return chatUser;
    } else {
      const { userId: newOwnerId } = await this.chatRepo.findNewOwner(
        chatId,
        userId,
      );

      if (newOwnerId) {
        const ownerAndChatUser = await this.chatRepo.updateOwnerAndDeleteUser(
          chatId,
          newOwnerId,
          userId,
        );

        this.logger.info('Updated owner in chat and deleted user from chat', {
          newOwnerId,
          chatId,
          userId,
        });
        return ownerAndChatUser;
      }

      const chat = await this.chatRepo.delete(chatId);

      this.logger.info('Deleted chat successfully', { chatId });
      return chat;
    }
  }

  async getUsersInChat(
    user: AccessTokenPayload,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredVCode> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    const { limit, cursor } = paginationDto;

    const users = await this.chatRepo.getUsersInChat(chatId, limit, cursor);

    const formattedUsers = users.map(({ user }) => user);

    const nextCursor =
      formattedUsers.length === limit ? formattedUsers.at(-1).id : null;

    const hasMore = nextCursor !== null;

    return {
      users: formattedUsers,
      nextCursor,
      limit,
      hasMore,
    };
  }
}
