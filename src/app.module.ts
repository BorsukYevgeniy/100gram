import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MessageModule } from './modules/message/message.module';

@Module({ imports: [UserModule, ConfigModule, AuthModule, MessageModule] })
export class AppModule {}
