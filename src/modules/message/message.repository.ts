import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMessagesInChat(chatId: number, take: number, cursor: number) {
    return await this.prisma.message.findMany({
      where: {
        chatId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take,
      orderBy: {
        id: 'desc',
      },
    });
  }

  async create(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
    files: string[] = [],
  ) {
    return await this.prisma.message.create({
      data: {
        ...dto,
        userId,
        chatId,
        files,
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.message.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateMessageDto, files: string[]) {
    return await this.prisma.message.update({
      where: { id },
      data: {
        text: dto.text,
        ...(files.length !== 0 && { files }),
      },
    });
  }

  async delete(id: number) {
    return await this.prisma.message.delete({ where: { id } });
  }
}
