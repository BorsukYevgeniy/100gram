import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRequest } from '../../../common/interfaces';
import { TokenService } from '../../token/token.service';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const accessToken: string = req.cookies.accessToken;

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(accessToken);

      if (payload.isVerified) {
        return true;
      }

      req.user = payload;

      return false;
    } catch (e: unknown) {
      throw new UnauthorizedException();
    }
  }
}
