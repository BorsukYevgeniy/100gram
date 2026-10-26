import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageFilesReactionCount } from '../types/message.types';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMessagesInChat(chatId: number, take: number, cursor: number) {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take,
      orderBy: {
        id: 'desc',
      },
      omit: { userId: true },
      include: {
        files: {
          select: { name: true, originalName: true },
        },
        user: {
          select: { id: true, nickname: true, avatarName: true },
        },
      },
    });

    if (messages.length === 0) {
      return [] as MessageFilesReactionCount[];
    }

    return messages;
  }

  async getReactionCounts(messageIds: number[]) {
    return this.prisma.reactionToMessage.groupBy({
      by: ['messageId', 'reaction'],
      where: {
        messageId: { in: messageIds },
      },
      _count: { _all: true },
    });
  }

  async getMyReactions(messageIds: number[], userId: number) {
    return this.prisma.reactionToMessage.findMany({
      where: {
        messageId: { in: messageIds },
        userId,
      },
      select: {
        messageId: true,
        reaction: true,
      },
    });
  }

  async getDeletedMessageIdsForUser(userId: number): Promise<number[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        deletedFor: {
          some: { id: userId },
        },
      },
      select: {
        id: true,
      },
    });

    return messages.map(({ id }) => id);
  }

  async create(
    userId: number,
    chatId: number,
    { replyId, text }: CreateMessageDto,
    filenames: string[] = [],
  ) {
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
        omit: { userId: true },
        include: {
          files: { select: { name: true, originalName: true } },
          user: { select: { id: true, nickname: true, avatarName: true } },
        },
      });

      await p.chat.update({
        where: { id: chatId },
        data: { lastMessage: { connect: { id: msg.id } } },
      });

      return msg;
    });
  }

  async findById(id: number) {
    return this.prisma.message.findUnique({
      where: { id },
      omit: { userId: true },
      include: {
        files: { select: { name: true, originalName: true } },
        user: { select: { id: true, nickname: true, avatarName: true } },
      },
    });
  }

  async update(id: number, dto: UpdateMessageDto, filenames: string[]) {
    return this.prisma.message.update({
      where: { id },
      data: {
        text: dto.text,
        ...(filenames.length !== 0 && {
          files: { connect: filenames.map((name) => ({ name })) },
        }),
      },
      include: {
        files: { select: { name: true, originalName: true } },
        user: { select: { id: true, nickname: true, avatarName: true } },
      },
      omit: { userId: true },
    });
  }

  async delete(id: number) {
    return this.prisma.message.delete({
      where: { id },
      include: {
        files: { select: { name: true, originalName: true } },
        user: { select: { id: true, nickname: true, avatarName: true } },
      },
      omit: { userId: true },
    });
  }

  async pinMessage(messageId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: true },
    });
  }

  async unpinMessage(messageId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: false },
    });
  }

  async deleteAll(chatId: number) {
    return this.prisma.message.deleteMany({
      where: {
        chatId,
      },
    });
  }

  async addMessageToDeletedForMe(messageId: number, userId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedFor: {
          connect: { id: userId },
        },
      },
    });
  }
}
