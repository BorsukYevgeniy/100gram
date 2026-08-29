import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import userMicroserviceConfig from '../../../config/user-microservice.config';
import { USER_CLIENT } from '../user.constant';
import { BlockedUserController } from './blocked-user.controller';
import { BlockedUserService } from './blocked-user.service';

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
  ],
  providers: [BlockedUserService],
  controllers: [BlockedUserController],
})
export class BlockedUserModule {}
