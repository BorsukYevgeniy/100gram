import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { FileModule } from './modules/file/file.module';
import { MessageModule } from './modules/message/message.module';
import { UserModule } from './modules/user/user.module';

import { ConfigModule, ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import pinoConfig from './config/pino.config';
import { validationSchema } from './config/schemas/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      validationSchema: validationSchema,
    }),
    ConfigModule.forFeature(appConfig),
    UserModule,
    AuthModule,
    MessageModule,
    ChatModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (c: ConfigType<typeof pinoConfig>) => c,
    }),
    FileModule,
  ],
})
export class AppModule {}
