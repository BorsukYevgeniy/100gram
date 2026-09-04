import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { USER_CLIENT } from '../../../common/client/user-client.constants';
import { UserClientModule } from '../../../common/client/user-client.module';
import userMicroserviceConfig from '../../../config/user-microservice.config';
import { ChatMemberRepositoryModule } from '../chat-member/repository/chat-member-repository.module';
import { ChatRepositoryModule } from '../repository/chat-repository.module';
import { ChatValidationService } from './chat-validation.service';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: USER_CLIENT,
          imports: [ConfigModule.forFeature(userMicroserviceConfig)],
          inject: [userMicroserviceConfig.KEY],
          useFactory: (с: ConfigType<typeof userMicroserviceConfig>) => с,
        },
      ],
    }),
    ChatRepositoryModule,
    ChatMemberRepositoryModule,
    UserClientModule,
  ],
  providers: [ChatValidationService],
  exports: [ChatValidationService],
})
export class ChatValidationModule {}
