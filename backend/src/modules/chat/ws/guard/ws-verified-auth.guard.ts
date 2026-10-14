import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { TokenService } from '../../../token/token.service';

import { Socket } from 'socket.io';

@Injectable()
export class WsVerifiedAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();

    const cookie = client.handshake.headers.cookie;

    if (!cookie) {
      throw new WsException('Unauthorized');
    }

    const accessToken = cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('access_token='))
      .split('=')[1];

    const payload = await this.tokenService.verifyAccessToken(accessToken);

    if (!payload.isVerified) {
      throw new WsException('Forbidden resource. Please verify your account');
    }

    client.data.user = payload;

    return true;
  }
}
