import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageFiles } from './types/message.types';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMessagesInChat(
    chatId: number,
    take: number,
    cursor: number,
  ): Promise<MessageFiles[]> {
    return await this.prisma.message.findMany({
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
    dto: CreateMessageDto,
    fileIds: number[] = [],
  ): Promise<MessageFiles> {
    return await this.prisma.message.create({
      data: {
        ...dto,
        userId,
        chatId,
        files: {
          connect: fileIds.map((id) => ({ id })),
        },
      },
      include: { files: true },
    });
  }

  async findById(id: number): Promise<MessageFiles> {
    return await this.prisma.message.findUnique({
      where: { id },
      include: { files: true },
    });
  }

  async update(
    id: number,
    dto: UpdateMessageDto,
    fileIds: number[],
  ): Promise<MessageFiles> {
    return await this.prisma.message.update({
      where: { id },
      data: {
        text: dto.text,
        ...(fileIds.length !== 0 && {
          files: { connect: fileIds.map((id) => ({ id })) },
        }),
      },
      include: { files: true },
    });
  }

  async delete(id: number): Promise<MessageFiles> {
    return await this.prisma.message.delete({
      where: { id },
      include: { files: true },
    });
  }
}
