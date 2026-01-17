import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddReactionDto } from './dto/add-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';

@Injectable()
export class ReactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addReaction(userId: number, messageId: number, dto: AddReactionDto) {
    return this.prisma.reactionToMessage.create({
      data: {
        ...dto,
        userId,
        messageId,
      },
    });
  }

  async updateReaction(
    userId: number,
    messageId: number,
    dto: UpdateReactionDto,
  ) {
    return this.prisma.reactionToMessage.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: dto,
    });
  }
  async removeReaction(userId: number, messageId: number) {
    return this.prisma.reactionToMessage.delete({
      where: {
        messageId_userId: { messageId, userId },
      },
    });
  }
}
