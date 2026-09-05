import { AddReactionDto, UpdateReactionDto } from '@app/contracts/reaction/dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

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
