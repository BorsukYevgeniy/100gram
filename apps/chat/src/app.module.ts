import { pinoConfig } from '@app/config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/message/message.module';
import { ReactionModule } from './modules/reaction/reaction.module';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (c: ConfigType<typeof pinoConfig>) => c,
    }),
    ChatModule,
    MessageModule,
    ReactionModule,
  ],
})
export class AppModule {}
