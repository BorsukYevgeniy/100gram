import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { BlockedUser } from '../../../../generated/prisma/client';
import { BlockedUserRepository } from './blocked-user.repository';

@Injectable()
export class BlockedUserService {
  constructor(private readonly blockedUserRepo: BlockedUserRepository) {}

  async blockUser(blockerId: number, blockedId: number): Promise<BlockedUser> {
    if (blockerId === blockedId) {
      throw new BadRequestException('User cannot block themselves');
    }

    try {
      return this.blockedUserRepo.blockUser(blockerId, blockedId);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        // this.logger.warn({ userId: id }, "User doesn't exist");
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async unblockUser(userId: number, blockedId: number): Promise<BlockedUser> {
    if (userId === blockedId) {
      throw new BadRequestException('User cannot unblock themselves');
    }

    try {
      return this.blockedUserRepo.unblockUser(userId, blockedId);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        // this.logger.warn({ userId: id }, "User doesn't exist");
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async getMyBlockedUsers(userId: number): Promise<BlockedUser[]> {
    return this.blockedUserRepo.getBlockedUsers(userId);
  }

  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    return this.blockedUserRepo.isBlocked(blockerId, blockedId);
  }
}
