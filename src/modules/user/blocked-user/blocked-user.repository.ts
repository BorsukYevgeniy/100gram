import { Injectable } from '@nestjs/common';
import { BlockedUser } from '../../../../generated/prisma/browser';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BlockedUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async blockUser(blockerId: number, blockedId: number): Promise<BlockedUser> {
    return this.prisma.blockedUser.create({
      data: {
        blockedId,
        blockerId,
      },
    });
  }

  async unblockUser(
    blockerId: number,
    blockedId: number,
  ): Promise<BlockedUser> {
    return this.prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockedId,
          blockerId,
        },
      },
    });
  }

  async getBlockedUsers(userId: number) {
    return this.prisma.blockedUser.findMany({
      where: {
        blockerId: userId,
      },
    });
  }

  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const count = await this.prisma.blockedUser.count({
      where: {
        OR: [
          { blockedId, blockerId },
          { blockedId: blockerId, blockerId: blockedId },
        ],
      },
    });
    return count > 0;
  }
}
