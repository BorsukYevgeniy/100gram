import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import chatMicroserviceConfig from '../../../config/chat-microservice.config';
import { CHAT_CLIENT } from './chat-client.constants';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: CHAT_CLIENT,
          imports: [ConfigModule.forFeature(chatMicroserviceConfig)],
          inject: [chatMicroserviceConfig.KEY],
          useFactory: (с: ConfigType<typeof chatMicroserviceConfig>) => с,
        },
      ],
    }),
  ],
  exports: [ClientsModule],
})
export class ChatClientModule {}
