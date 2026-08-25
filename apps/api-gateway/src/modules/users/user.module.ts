import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import userMicroserviceConfig from '../../config/user-microservice.config';
import { USER_CLIENT } from './user.constant';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule.forFeature(userMicroserviceConfig),
    ClientsModule.registerAsync({
      clients: [
        {
          name: USER_CLIENT,
          imports: [ConfigModule.forFeature(userMicroserviceConfig)],
          inject: [userMicroserviceConfig.KEY],
          useFactory: (
            userMicroserviceConf: ConfigType<typeof userMicroserviceConfig>,
          ) => userMicroserviceConf,
        },
      ],
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
