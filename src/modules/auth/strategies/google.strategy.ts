import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PinoLogger } from 'nestjs-pino';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '../../config/config.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly logger: PinoLogger,
  ) {
    super(configService.GOOGLE_CONFIG);
    logger.setContext(GoogleStrategy.name);
  }

  async validate(
    acessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const user = await this.authService.validateGoogleUser({
      email: profile._json.email,
      nickname: profile._json.name,
      password: '',
    });

    this.logger.info(
      {
        userId: user.id,
        provider: 'google',
      },
      'Google login success',
    );

    done(null, {
      id: user.id,
      role: user.role,
      isVerified: true,
    });
  }
}
