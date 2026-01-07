import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthRequest } from '../../../common/types';
import { TokenService } from '../../token/token.service';
import { RequiredRoles } from '../decorator/required-roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requieredRoles = this.reflector.get(
      RequiredRoles,
      context.getHandler(),
    );

    const req = context.switchToHttp().getRequest<AuthRequest>();

    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      req.user = payload;

      if (!requieredRoles) {
        return true;
      }

      return requieredRoles.includes(payload.role);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
