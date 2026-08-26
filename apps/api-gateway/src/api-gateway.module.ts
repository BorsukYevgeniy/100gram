import pinoConfig from '@app/config/pino.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api-gateway/.env',
    }),
    // ConfigModule.forFeature(appConfig),
    UserModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (c: ConfigType<typeof pinoConfig>) => c,
    }),
    AuthModule,
  ],
})
export class ApiGatewayModule {}
