import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { ChatType } from './enum/chat-type.enum';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrivateChat(userId: number, participantId: number) {
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

  async createGroupChat(dto: CreateGroupChatDto) {
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

  async updateGroupChat(id: number, dto: UpdateGroupChatDto) {
    return await this.prisma.chat.update({
      where: { id },
      data: dto,
    });
  }

  async getById(id: number) {
    return await this.prisma.chat.findUnique({
      where: { id },
    });
  }

  async delete(id: number) {
    return await this.prisma.chat.delete({
      where: { id },
    });
  }
}
