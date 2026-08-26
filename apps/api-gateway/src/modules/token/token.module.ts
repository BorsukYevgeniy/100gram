import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import userMicroserviceConfig from '../../config/user-microservice.config';
import { USER_CLIENT } from '../user/user.constant';
import { TokenService } from './token.service';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: USER_CLIENT,
          imports: [ConfigModule.forFeature(userMicroserviceConfig)],
          inject: [userMicroserviceConfig.KEY],
          useFactory: (c: ConfigType<typeof userMicroserviceConfig>) => c,
        },
      ],
    }),
  ],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
