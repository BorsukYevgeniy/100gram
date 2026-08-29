import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BlockUserDto } from '../../../../../../libs/contracts/src/blocked-user/dto';
import { BlockedUser } from '../../../../../../libs/contracts/src/blocked-user/interface';
import { BlockedUserPattern } from '../../../../../../libs/contracts/src/blocked-user/pattern';
import { UnblockUserPayload } from '../../../../../../libs/contracts/src/blocked-user/payload';
import { USER_CLIENT } from '../user.constant';

@Injectable()
export class BlockedUserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: BlockedUserPattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.userClient.send<TOut, TIn>(pattern, input));
  }

  async block(userId: number, blockedId: number): Promise<BlockedUser> {
    return this.send<BlockedUser, BlockUserDto>(BlockedUserPattern.BLOCK, {
      blockedId,
      blockerId: userId,
    });
  }

  async unblock(userId: number, blockedId: number): Promise<BlockedUser> {
    return this.send<BlockedUser, UnblockUserPayload>(
      BlockedUserPattern.UNBLOCK,
      {
        userId,
        blockedId,
      },
    );
  }

  async isBlocked(userId: number, blockedId: number): Promise<boolean> {
    return this.send<boolean, BlockUserDto>(BlockedUserPattern.UNBLOCK, {
      blockedId,
      blockerId: userId,
    });
  }

  async getMyBlocked(userId: number): Promise<BlockedUser[]> {
    return this.send<BlockedUser[], number>(BlockedUserPattern.UNBLOCK, userId);
  }
}
