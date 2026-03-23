import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { ChatType } from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { PaginatedUserNoCredOtpVCode } from '../../user/types/user.types';
import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

@Injectable()
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
      this.logger.warn({ chatId }, "Chat doesn't exist");
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      chatId,
    );

    if (!isParticipant) {
      this.logger.warn(
        { userId, chatId },
        'User is not participant of the chat',
      );
      throw new ForbiddenException('User is not a participant of the chat');
    }

    if (chat.chatType === ChatType.PRIVATE) {
      const deletedChat = await this.chatRepo.delete(chatId);
      this.logger.info({ chatId }, 'Deleted private chat');
      return deletedChat;
    } else if (chat.ownerId !== userId) {
      const chatUser = await this.chatRepo.deleteUserFromChat(chatId, userId);
      this.logger.info({ userId, chatId }, 'Deleted user from group chat');
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
        this.logger.info(
          { newOwnerId, chatId, userId },
          'Updated chat owner and deleted user from chat',
        );
        return ownerAndChatUser;
      }

      const deletedChat = await this.chatRepo.delete(chatId);
      this.logger.info({ chatId }, 'Deleted group chat as no new owner found');
      return deletedChat;
    }
  }

  async getUsersInChat(
    user: AccessTokenPayload,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    await this.chatValidator.validateChatParticipation(user, chatId);

    const { limit, cursor } = paginationDto;

    const users = await this.chatRepo.getUsersInChat(chatId, limit, cursor);
    const formattedUsers = users.map(({ user }) => user);

    const nextCursor =
      formattedUsers.length === limit ? formattedUsers.at(-1).id : null;
    const hasMore = nextCursor !== null;

    this.logger.info(
      { chatId, userId: user.id, limit, nextCursor, hasMore },
      'Fetched users in chat',
    );

    return {
      users: formattedUsers,
      nextCursor,
      limit,
      hasMore,
    };
  }

  async updateUserChatRole(
    currentUser: AccessTokenPayload,
    chatId: number,
    userId: number,
    { role }: UpdateRoleDto,
  ) {
    await this.chatValidator.validateOwner(currentUser, chatId);

    try {
      const chatUser = await this.chatRepo.updateChatRole(chatId, userId, role);

      this.logger.info(
        { chatId, userId, newRole: role },
        'Updated user role in chat',
      );

      return chatUser;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        this.logger.warn({ chatId, userId }, 'User or chat not found');
        throw new NotFoundException('User or chat not found');
      }
      throw e;
    }
  }
}
