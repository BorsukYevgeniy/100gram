import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '../../config/config.service';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.GOOGLE_CONFIG.clientID,
      clientSecret: configService.GOOGLE_CONFIG.clientSecret,
      callbackURL: configService.GOOGLE_CONFIG.callbackURL,
      scope: ['email', 'profile'],
    });
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

    done(null, { id: user.id, role: user.role });
  }
}
