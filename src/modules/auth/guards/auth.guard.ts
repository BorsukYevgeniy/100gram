import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRequest, JwtPayload } from '../../../common/interfaces';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
