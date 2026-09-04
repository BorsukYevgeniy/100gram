import { Injectable } from '@nestjs/common';
import { CreateChannelDto } from '@app/contracts//chat/dto/create-channel.dto';
import { CreateGroupChatDto } from '@app/contracts//chat/dto/create-group-chat.dto';
import { UpdateGroupChatDto } from '@app/contracts//chat/dto/update-group-chat.dto';
import { MyChat } from '@app/contracts//chat/types/chat.types';
import { Chat } from '../../../../generated/prisma/client';
import { ChatRole, ChatType } from '../../../../generated/prisma/enums';
import { PrismaService } from '../../../infra/prisma/prisma.service';

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
        owner: { connect: { id: ownerId } },
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

  async updateAvatar(chatId: number, avatar?: string) {
    return this.prisma.chat.update({
      where: { id: chatId, chatType: ChatType.GROUP },
      data: {
        avatar,
      },
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
      },
      take,
      orderBy: { lastMessageId: 'desc' },
      select: {
        id: true,
        title: true,
        avatar: true,
        lastMessage: { select: { text: true, createdAt: true } },
      },
    });
  }

  async findChatType(chatId: number): Promise<{ chatType: ChatType }> {
    return this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { chatType: true },
    });
  }
}
