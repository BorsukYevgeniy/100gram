import { Injectable } from '@nestjs/common';
import { ChatToUser } from '../../../../../generated/prisma/browser';
import { ChatRole } from '../../../../../generated/prisma/enums';
import { PrismaService } from '../../../../infra/prisma/prisma.service';

@Injectable()
export class ChatMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async deleteUserFromChat(chatId: number, userId: number) {
    return this.prisma.$transaction([
      this.prisma.chatToUser.delete({
        where: { chatId_userId: { chatId, userId } },
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: { membersCount: { decrement: 1 } },
        select: { membersCount: true },
      }),
    ]);
  }

  async addUserToChat(chatId: number, userId: number) {
    return await this.prisma.$transaction([
      this.prisma.chatToUser.create({
        data: { chatId, userId },
      }),
      this.prisma.chat.update({
        where: { id: chatId },
        data: {
          membersCount: { increment: 1 },
        },
        select: { membersCount: true },
      }),
    ]);
  }

  async getUsersInChat(chatId: number, take: number, userCursor: number) {
    return this.prisma.chatToUser.findMany({
      where: { chatId },
      select: {
        userId: true,
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
        userId: 'asc',
      },
    });
  }

  async getUserIdsInChat(chatId: number) {
    return this.prisma.chatToUser.findMany({
      where: { chatId },
      select: {
        userId: true,
      },
    });
  }

  async getChatUser(chatId: number, userId: number) {
    return this.prisma.chatToUser.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
  }

  async updateChatRole(chatId: number, userId: number, role: ChatRole) {
    return this.prisma.chatToUser.update({
      where: { chatId_userId: { chatId, userId } },
      data: { role },
    });
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

  async updateOwner(chatId: number, newOwnerId: number) {
    const [_, newOwner] = await this.prisma.$transaction([
      this.prisma.chatToUser.updateMany({
        where: { chatId, role: ChatRole.OWNER },
        data: { role: ChatRole.MEMBER },
      }),

      this.prisma.chatToUser.update({
        where: { chatId_userId: { chatId, userId: newOwnerId } },
        data: { role: ChatRole.OWNER },
      }),
    ]);

    return newOwner;
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
      this.prisma.chatToUser.update({
        where: { chatId_userId: { chatId, userId: newOwnerId } },
        data: { role: ChatRole.OWNER },
      }),
    ]);
  }

  async findChatOwner(chatId: number): Promise<ChatToUser> {
    return this.prisma.chatToUser.findFirst({
      where: {
        chatId,
        role: ChatRole.OWNER,
      },
    });
  }

  async findChatsWhereUserIsOwner(userId: number) {
    return this.prisma.chatToUser.findMany({
      where: { userId, role: ChatRole.OWNER },
    });
  }
}
