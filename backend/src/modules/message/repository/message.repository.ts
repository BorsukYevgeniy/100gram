import { Injectable } from '@nestjs/common';
import { Reaction } from '../../../../generated/prisma/enums';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { MessageFilesReactionCount } from '../types/message.types';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMessagesInChat(
    currentUserId: number,
    chatId: number,
    take: number,
    cursor: number,
  ): Promise<MessageFilesReactionCount[]> {
    const msg = await this.prisma.message.findMany({
      where: {
        chatId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take,
      orderBy: {
        id: 'desc',
      },
      include: {
        files: {
          select: { name: true },
        },
      },
    });

    if (msg.length === 0) {
      return [] as MessageFilesReactionCount[];
    }

    const reactions = await this.prisma.reactionToMessage.groupBy({
      by: ['messageId', 'reaction'],
      where: {
        messageId: {
          in: msg.map((m) => m.id),
        },
      },
      _count: {
        _all: true,
      },
    });

    const reactionCounts = new Map<number, Partial<Record<Reaction, number>>>();

    for (const r of reactions) {
      const counts = reactionCounts.get(r.messageId) ?? {};

      counts[r.reaction] = r._count._all;

      reactionCounts.set(r.messageId, counts);
    }

    const myReactions = await this.prisma.reactionToMessage.findMany({
      where: {
        messageId: {
          in: msg.map((m) => m.id),
        },
        userId: currentUserId,
      },
      select: {
        messageId: true,
        reaction: true,
      },
    });

    const myReactionSet = new Set(
      myReactions.map((r) => `${r.messageId}:${r.reaction}`),
    );

    return msg.map((m) => {
      const counts = reactionCounts.get(m.id) ?? {};

      return {
        id: m.id,
        chatId: m.chatId,
        createdAt: m.createdAt,
        fileNames: m.files.map(({ name }) => name),
        isPinned: m.isPinned,
        replyId: m.replyId,
        text: m.text,
        userId: m.userId,
        reactions: {
          like: {
            count: counts[Reaction.LIKE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.LIKE}`),
          },
          dislike: {
            count: counts[Reaction.DISLIKE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.DISLIKE}`),
          },
          heart: {
            count: counts[Reaction.HEART] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.HEART}`),
          },
          heartWithFire: {
            count: counts[Reaction.HEART_WITH_FIRE] ?? 0,
            isReactedByMe: myReactionSet.has(
              `${m.id}:${Reaction.HEART_WITH_FIRE}`,
            ),
          },
          fire: {
            count: counts[Reaction.FIRE] ?? 0,
            isReactedByMe: myReactionSet.has(`${m.id}:${Reaction.FIRE}`),
          },
        },
      };
    });
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
        include: { files: { select: { name: true } } },
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
      include: { files: true },
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
      include: { files: true },
    });
  }

  async delete(id: number) {
    return this.prisma.message.delete({
      where: { id },
      include: { files: true },
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
}
