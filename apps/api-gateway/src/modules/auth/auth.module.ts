import { Module } from '@nestjs/common';
// import { MailModule } from '../../infra/mail/mail.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { AuthMailService } from './mail/auth-mail.service';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import authConfig from '../../config/auth.config';
import googleOauthConfig from '../../config/google-oath.config';
import throttlerConfig from '../../config/throttler.config';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { GoogleStrategy } from './strategy/google.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(authConfig),

    UserModule,
    TokenModule,
    // MailModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule.forFeature(throttlerConfig)],
      inject: [throttlerConfig.KEY],
      useFactory: (config: ConfigType<typeof throttlerConfig>) => config,
    }),
  ],
  controllers: [AuthController],
  providers: [/*AuthMailService*/ AuthService, GoogleStrategy],
})
export class AuthModule {}
