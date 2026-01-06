import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, chatId: number, dto: CreateMessageDto) {
    return await this.prisma.message.create({
      data: {
        ...dto,
        userId: userId,
        chatId: chatId,
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.message.findUnique({ where: { id } });
  }

  async update(id: number, dto: UpdateMessageDto) {
    return await this.prisma.message.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number) {
    return await this.prisma.message.delete({ where: { id } });
  }
}
