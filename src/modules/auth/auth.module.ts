import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MailModule } from '../mail/mail.module';
import { TokenModule } from '../token/token.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [UserModule, ConfigModule, TokenModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
})
export class AuthModule {}
