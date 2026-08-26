import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import userMicroserviceConfig from '../../config/user-microservice.config';
import { TokenModule } from '../token/token.module';
import { USER_CLIENT } from './user.constant';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
    TokenModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
