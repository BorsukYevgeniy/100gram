import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BlockUserDto } from '@app/contracts/blocked-user/dto';
import { BlockedUser } from '@app/contracts/blocked-user/interface';
import { BlockedUserPattern } from '@app/contracts/blocked-user/pattern';
import { UnblockUserPayload } from '@app/contracts/blocked-user/payload';
import { USER_CLIENT } from '../../../common/client/user/user-client.constants';

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

