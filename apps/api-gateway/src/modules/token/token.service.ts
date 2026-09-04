import { Role } from '@app/contracts/auth';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_CLIENT } from '../../common/client/user/user-client.constants';

@Injectable()
export class TokenService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  async generateTokens(id: number, role: Role, isVerified: boolean) {
    return firstValueFrom(
      this.userClient.send('token.generateTokens', { id, role, isVerified }),
    );
  }

  async deleteToken(token: string) {
    return firstValueFrom(this.userClient.send('token.deleteToken', token));
  }

  async deleteAllUserTokens(userId: number) {
    return firstValueFrom(
      this.userClient.send('userId.deleteAllUserTokens', userId),
    );
  }

  async verifyRefreshToken(token: string) {
    return firstValueFrom(
      this.userClient.send('token.verifyRefreshToken', token),
    );
  }

  async verifyAccessToken(token: string) {
    return firstValueFrom(
      this.userClient.send('token.verifyAccessToken', token),
    );
  }

  async getUserTokens(userId: number) {
    return firstValueFrom(this.userClient.send('token.getUserTokens', userId));
  }

  async update(id: number, role: Role, isVerified: boolean, oldToken: string) {
    return firstValueFrom(
      this.userClient.send('token.update', {
        id,
        isVerified,
        oldToken,
        role,
      }),
    );
  }
}
