import { Injectable } from '@nestjs/common';
import { Chat, ChatToUser } from '../../../generated/prisma/client';
import { ChatType } from '../../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_CHAT_AVATAR_NAME } from './avatar/chat-avatar.constants';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrivateChat(
    userId: number,
    participantId: number,
  ): Promise<Chat> {
    return this.prisma.chat.create({
      data: {
        chatType: ChatType.PRIVATE,
        chatToUsers: {
          create: [
            {
              userId: userId,
            },
            {
              userId: participantId,
            },
          ],
        },
      },
    });
  }

  async createGroupChat(
    ownerId: number,
    dto: CreateGroupChatDto,
  ): Promise<Chat> {
    return this.prisma.chat.create({
      data: {
        avatar: DEFAULT_CHAT_AVATAR_NAME,
        chatType: ChatType.GROUP,
        ownerId,
        title: dto.title,
        description: dto.description,
        chatToUsers: {
          create: dto.userIds.map((id) => ({ userId: id })),
        },
      },
    });
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    return this.prisma.chat.update({
      where: { id },
      data: dto,
    });
  }

  async getById(id: number): Promise<Chat> {
    return this.prisma.chat.findUnique({
      where: { id },
    });
  }

  async delete(id: number): Promise<Chat> {
    return this.prisma.chat.delete({
      where: { id },
    });
  }

  async updateOwner(chatId: number, newOnwerId: number): Promise<Chat> {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { ownerId: newOnwerId },
    });
  }

  async updateOwnerAndDeleteUser(
    chatId: number,
    newOwnerId: number,
    userId: number,
  ) {
    return this.prisma.$transaction([
      this.prisma.chatToUser.delete({
        where: { chatId_userId: { chatId, userId } },
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: { ownerId: newOwnerId },
      }),
    ]);
  }

  async findNewOwner(
    chatId: number,
    currentOwnerId: number,
  ): Promise<ChatToUser> {
    return this.prisma.chatToUser.findFirst({
      where: {
        chatId: chatId,
        userId: { not: { equals: currentOwnerId } },
      },
    });
  }

  async updateAvatar(chatId: number, avatar?: string) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: {
        avatar: avatar ? avatar : DEFAULT_CHAT_AVATAR_NAME,
      },
    });
  }

  async deleteUserFromChat(
    chatId: number,
    userId: number,
  ): Promise<ChatToUser> {
    return this.prisma.chatToUser.delete({
      where: { chatId_userId: { chatId, userId } },
    });
  }

  async addUserToChat(chatId: number, userId: number): Promise<ChatToUser> {
    return this.prisma.chatToUser.create({
      data: { chatId, userId },
    });
  }

  async getUsersInChat(chatId: number, take: number, userCursor: number) {
    return this.prisma.chatToUser.findMany({
      where: { chatId },
      select: {
        user: {
          omit: {
            email: true,
            password: true,
            verificationCode: true,
          },
        },
      },

      ...(userCursor && {
        cursor: {
          chatId_userId: {
            chatId,
            userId: userCursor,
          },
        },
        skip: 1,
      }),
      take,
      orderBy: {
        user: {
          id: 'asc',
        },
      },
    });
  }

  async getUserIdsInChat(chatId: number) {
    return this.prisma.chatToUser.findMany({
      where: { chatId },
      select: {
        user: {
          select: { id: true },
        },
      },
    });
  }
}
