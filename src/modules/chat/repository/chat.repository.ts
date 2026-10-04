import { Injectable } from '@nestjs/common';
import { ChatToUser } from '../../../../generated/prisma/browser';
import { Chat } from '../../../../generated/prisma/client';
import { ChatRole, ChatType } from '../../../../generated/prisma/enums';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AllowReactionDto } from '../dto/allow-reaction.dto';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateGroupChatDto } from '../dto/create-group-chat.dto';
import { UpdateGroupChatDto } from '../dto/update-group-chat.dto';
import { MyChat } from '../types/chat.types';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createChannel(
    dto: CreateChannelDto,
    ownerId: number,
    inviteLink?: string,
  ) {
    return this.prisma.chat.create({
      data: {
        chatType: ChatType.CHANNEL,
        ...dto,
        chatToUsers: {
          create: { userId: ownerId, role: ChatRole.OWNER },
        },
        inviteLink,
      },
    });
  }

  async createPrivateChat(
    userId: number,
    participantId: number,
  ): Promise<Chat> {
    return this.prisma.chat.create({
      data: {
        chatType: ChatType.PRIVATE,
        membersCount: 2,
        chatToUsers: {
          create: [
            {
              userId: userId,
              role: ChatRole.OWNER,
            },
            {
              userId: participantId,
              role: ChatRole.OWNER,
            },
          ],
        },
      },
    });
  }

  async createGroupChat(
    ownerId: number,
    { title, userIds, visibility, description }: CreateGroupChatDto,
    inviteToken?: string,
  ): Promise<Chat> {
    return this.prisma.chat.create({
      data: {
        chatType: ChatType.GROUP,
        title,
        description,
        visibility,
        inviteToken,
        membersCount: userIds.length + 1,

        chatToUsers: {
          create: [
            ...userIds.map((userId) => ({ userId })),
            { userId: ownerId, role: ChatRole.OWNER },
          ],
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

  async updateGroupChatOrChannel(
    id: number,
    dto: UpdateGroupChatDto,
  ): Promise<Chat> {
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

  async updateAvatar(chatId: number, avatar: string) {
    return this.prisma.chat.update({
      where: { id: chatId, chatType: ChatType.GROUP },
      data: {
        avatar: {
          connect: { name: avatar },
        },
      },
    });
  }

  async deleteAvatar(chatId: number) {
    return this.prisma.chat.update({
      where: { id: chatId, chatType: ChatType.GROUP },
      data: {
        avatar: {
          disconnect: true,
        },
      },
    });
  }

  async getMyChats(
    userId: number,
    take: number,
    lastMessageIdCursor?: number,
  ): Promise<MyChat[]> {
    const r = await this.prisma.chat.findMany({
      where: {
        chatToUsers: {
          some: { userId },
        },
      },
      ...(lastMessageIdCursor && {
        cursor: { lastMessageId: lastMessageIdCursor },
      }),
      take,
      orderBy: { lastMessageId: 'desc' },
      select: {
        id: true,
        title: true,
        avatarName: true,
        lastMessage: {
          select: {
            text: true,
            createdAt: true,
          },
        },
        chatToUsers: {
          where: { userId },
          select: {
            isPinned: true,
          },
        },
      },
    });

    return r.map(({ avatarName, chatToUsers, id, title, lastMessage }) => ({
      id: id,
      title: title,
      avatarName: avatarName,
      lastMessage: lastMessage,
      isPinned: chatToUsers[0]?.isPinned ?? false,
    }));
  }

  async findChatType(chatId: number): Promise<{ chatType: ChatType }> {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { chatType: true },
    });
  }

  async pinChat(userId: number, chatId: number): Promise<ChatToUser> {
    return this.prisma.chatToUser.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isPinned: true },
    });
  }

  async unpinChat(userId: number, chatId: number): Promise<ChatToUser> {
    return this.prisma.chatToUser.update({
      where: { chatId_userId: { chatId, userId } },
      data: { isPinned: false },
    });
  }

  async updateAllowedReaction(chatId: number, dto: AllowReactionDto) {
    return this.prisma.chat.update({
      where: { id: chatId },
      data: dto,
    });
  }
}
