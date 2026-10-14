import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AccessTokenPayload } from '../../../../common/types';

export const WsCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToWs().getClient<Socket>().data;
    return req.user as AccessTokenPayload;
  },
);
