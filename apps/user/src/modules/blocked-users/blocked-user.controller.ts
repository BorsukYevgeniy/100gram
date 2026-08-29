import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BlockedUser } from '../../../generated/prisma/browser';
import { BlockedUserService } from './blocked-user.service';

import { BlockUserDto } from '@app/contracts/blocked-user/dto';
import { BlockedUserPattern } from '@app/contracts/blocked-user/pattern';
import { UnblockUserPayload } from '@app/contracts/blocked-user/payload';

@Controller('blocked-users')
export class BlockedUserController {
  constructor(private readonly userService: BlockedUserService) {}

  @MessagePattern(BlockedUserPattern.BLOCK)
  async blockUser(
    @Payload() { blockedId, blockerId }: BlockUserDto,
  ): Promise<BlockedUser> {
    return this.userService.blockUser(blockerId, blockedId);
  }

  @MessagePattern(BlockedUserPattern.UNBLOCK)
  async unblockUser(
    @Payload() { blockedId, userId }: UnblockUserPayload,
  ): Promise<BlockedUser> {
    return this.userService.unblockUser(userId, blockedId);
  }

  @MessagePattern(BlockedUserPattern.GET_MY_BLOCKED)
  async getMyBlockedUsers(userId: number): Promise<BlockedUser[]> {
    return this.userService.getMyBlockedUsers(userId);
  }

  @MessagePattern(BlockedUserPattern.IS_BLOCKED)
  async isBlocked(
    @Payload() { blockedId, blockerId }: BlockUserDto,
  ): Promise<boolean> {
    return this.userService.isBlocked(blockerId, blockedId);
  }
}
