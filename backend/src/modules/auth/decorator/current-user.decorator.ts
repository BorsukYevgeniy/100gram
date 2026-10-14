import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../../../common/types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    return req.user;
  },
);
