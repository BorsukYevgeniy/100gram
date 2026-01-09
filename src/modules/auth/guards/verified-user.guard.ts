import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AuthRequest } from '../../../common/types';
import { TokenService } from '../../token/token.service';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VerifiedUserGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const accessToken: string = req.cookies.access_token;

    if (!accessToken) {
      this.logger.warn(
        {
          source: 'cookies',
        },
        'Access token missing',
      );
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      req.user = payload;

      this.logger.info('User authenticated', {
        id: payload.id,
        role: payload.role,
        isVerified: payload.isVerified,
      });

      if (payload.isVerified) {
        return true;
      }

      return false;
    } catch (e: unknown) {
      throw new UnauthorizedException();
    }
  }
}
