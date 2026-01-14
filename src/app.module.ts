import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConfigModule } from './modules/config/config.module';
import { ConfigService } from './modules/config/config.service';
import { FileModule } from './modules/file/file.module';
import { MailModule } from './modules/mail/mail.module';
import { MessageModule } from './modules/message/message.module';
import { TokenModule } from './modules/token/token.module';
import { UserModule } from './modules/user/user.module';

import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'files'),
    }),
    UserModule,
    AuthModule,
    MessageModule,
    ChatModule,
    TokenModule,
    MailModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.PINO_CONFIG,
    }),
    FileModule,
  ],
})
export class AppModule {}
