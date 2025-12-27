import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/message/message.module';
import { UserModule } from './modules/user/user.module';
import { TokenModule } from './modules/token/token.module';

@Module({
  imports: [UserModule, ConfigModule, AuthModule, MessageModule, ChatModule, TokenModule],
})
export class AppModule {}
