import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Role } from '../../../../generated/prisma/enums';
import { AuthRequest } from '../../../common/types';
import { TokenService } from '../../token/token.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdminGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();

    const accessToken = req.cookies.access_token;

    if (!accessToken) {
      this.logger.warn(
        {
          source: 'cookies',
        },
        'Access token missing',
      );
      throw new UnauthorizedException(
        'You must be authorized to access this resource',
      );
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      req.user = payload;

      this.logger.info('User authenticated', {
        id: payload.id,
        role: payload.role,
        isVerified: payload.isVerified,
      });

      if (payload.role !== Role.ADMIN)
        throw new ForbiddenException(
          'You must be an administator to access this resource',
        );

      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) {
        throw e;
      }
      throw new UnauthorizedException(
        'You must be authorized to access this resource',
      );
    }
  }
}
