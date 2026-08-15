import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { MailModule } from './infra/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { FileModule } from './modules/file/file.module';
import { MessageModule } from './modules/message/message.module';
import { TokenModule } from './modules/token/token.module';
import { UserModule } from './modules/user/user.module';

import { ConfigModule, ConfigType } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import appConfig from './config/app.config';
import pinoConfig from './config/pino.config';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ConfigModule.forFeature(appConfig),
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
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (config: ConfigType<typeof pinoConfig>) => config,
    }),
    FileModule,
    CacheModule,
  ],
})
export class AppModule {}
