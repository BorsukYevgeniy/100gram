import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageFiles } from '../types/message.types';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMessagesInChat(
    chatId: number,
    take: number,
    cursor: number,
  ): Promise<MessageFiles[]> {
    return this.prisma.message.findMany({
      where: {
        chatId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take,
      orderBy: {
        id: 'desc',
      },
      include: { files: true },
    });
  }

  async create(
    userId: number,
    chatId: number,
    { replyId, text }: CreateMessageDto,
    filenames: string[] = [],
  ): Promise<MessageFiles> {
    return this.prisma.$transaction(async (p) => {
      const msg = await p.message.create({
        data: {
          text,
          user: { connect: { id: userId } },
          chat: { connect: { id: chatId } },
          ...(replyId && { reply: { connect: { id: replyId } } }),
          files: {
            connect: filenames.map((name) => ({ name })),
          },
        },
        include: { files: true },
      });

      await p.chat.update({
        where: { id: chatId },
        data: { lastMessage: { connect: { id: msg.id } } },
      });

      return msg;
    });
  }

  async findById(id: number): Promise<MessageFiles> {
    return this.prisma.message.findUnique({
      where: { id },
      include: { files: true },
    });
  }

  async update(
    id: number,
    dto: UpdateMessageDto,
    filenames: string[],
  ): Promise<MessageFiles> {
    return this.prisma.message.update({
      where: { id },
      data: {
        text: dto.text,
        ...(filenames.length !== 0 && {
          files: { connect: filenames.map((name) => ({ name })) },
        }),
      },
      include: { files: true },
    });
  }

  async delete(id: number): Promise<MessageFiles> {
    return this.prisma.message.delete({
      where: { id },
      include: { files: true },
    });
  }
}
