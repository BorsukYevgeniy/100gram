import { Injectable } from '@nestjs/common';
import { Chat, ChatToUser } from '../../../generated/prisma/client';
import { ChatType } from '../../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrivateChat(
    userId: number,
    participantId: number,
  ): Promise<Chat> {
    return await this.prisma.chat.create({
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

  async createGroupChat(dto: CreateGroupChatDto): Promise<Chat> {
    return await this.prisma.chat.create({
      data: {
        chatType: ChatType.GROUP,
        title: dto.title,
        description: dto.desctiption,
        chatToUsers: {
          create: dto.userIds.map((id) => ({ userId: id })),
        },
      },
    });
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    return await this.prisma.chat.update({
      where: { id },
      data: dto,
    });
  }

  async getById(id: number): Promise<Chat> {
    return await this.prisma.chat.findUnique({
      where: { id },
    });
  }

  async delete(id: number): Promise<Chat> {
    return await this.prisma.chat.delete({
      where: { id },
    });
  }

  async deleteUserFromChat(
    chatId: number,
    userId: number,
  ): Promise<ChatToUser> {
    return await this.prisma.chatToUser.delete({
      where: { chatId_userId: { chatId, userId } },
    });
  }

  async addUserToChat(chatId: number, userId: number): Promise<ChatToUser> {
    return await this.prisma.chatToUser.create({
      data: { chatId, userId },
    });
  }

  async getUserIdsInChat(chatId: number): Promise<{ userId: number }[]> {
    return await this.prisma.chatToUser.findMany({
      where: { chatId },
      select: { userId: true },
    });
  }
}
