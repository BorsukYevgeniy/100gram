import { Injectable } from '@nestjs/common';
import { Chat, ChatToUser } from '../../../../generated/prisma/client';
import { ChatRole, ChatType } from '../../../../generated/prisma/enums';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateGroupChatDto } from '../dto/create-group-chat.dto';
import { UpdateGroupChatDto } from '../dto/update-group-chat.dto';
import { MyChat } from '../types/chat.types';

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
    inviteToken?: string,
  ): Promise<Chat> {
    return this.prisma.chat.create({
      data: {
        chatType: ChatType.GROUP,
        ownerId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility,
        inviteToken,

        chatToUsers: {
          create: dto.userIds.map((id) => ({ userId: id })),
        },
      },
    });
  }

  async updateInviteToken(chatId: number, inviteToken: string) {
    return this.prisma.chat.update({
      where: { id: chatId, chatType: ChatType.GROUP },
      data: { inviteToken },
    });
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    return this.prisma.chat.update({
      where: { id, chatType: ChatType.GROUP },
      data: dto,
    });
  }

  async getById(id: number): Promise<Chat> {
    return this.prisma.chat.findUnique({
      where: { id },
    });
  }

  async getByinviteToken(inviteToken: string): Promise<Chat> {
    return this.prisma.chat.findUnique({
      where: { inviteToken, chatType: ChatType.GROUP },
    });
  }

  async delete(id: number): Promise<Chat> {
    return this.prisma.chat.delete({
      where: { id },
    });
  }

  async updateOwner(chatId: number, newOnwerId: number): Promise<Chat> {
    return this.prisma.chat.update({
      where: { id: chatId, chatType: ChatType.GROUP },
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
        where: { id: chatId, chatType: ChatType.GROUP },
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
      where: { id: chatId, chatType: ChatType.GROUP },
      data: {
        avatar,
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
            otpAttempts: true,
            otpHash: true,
            otpExpiresAt: true,
            provider: true,
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

  async getMyChats(
    userId: number,
    take: number,
    lastMessageIdCursor?: number,
  ): Promise<MyChat[]> {
    return this.prisma.chat.findMany({
      where: {
        chatToUsers: {
          some: { userId },
        },

        ...(lastMessageIdCursor && {
          cursor: { lastMessageId: lastMessageIdCursor },
        }),

        orderBy: { lastMessageId: 'desc' },

        take,
      },

      select: {
        id: true,
        title: true,
        avatar: true,
        lastMessage: { select: { text: true, createdAt: true } },
      },
    });
  }
}
