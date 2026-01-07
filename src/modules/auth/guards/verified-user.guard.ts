import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRequest } from '../../../common/types';
import { TokenService } from '../../token/token.service';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const accessToken: string = req.cookies.access_token;

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      req.user = payload;

      if (payload.isVerified) {
        return true;
      }

      return false;
    } catch (e: unknown) {
      throw new UnauthorizedException();
    }
  }
}
