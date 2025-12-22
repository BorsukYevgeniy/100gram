import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtService } from '@nestjs/jwt';
import { AuthRequest, JwtPayload } from '../../../common/interfaces';
import { ConfigService } from '../../config/config.service';
import { RequiredRoles } from '../decorator/required-roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requieredRoles = this.reflector.get(
      RequiredRoles,
      context.getHandler(),
    );
    if (!requieredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthRequest>();

    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        accessToken,
        {
          secret: this.configService.ACCESS_TOKEN_SECRET,
        },
      );

      req.user = payload;
      return requieredRoles.includes(payload.role);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
