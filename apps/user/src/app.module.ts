import pinoConfig from '@app/config/pino.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import { PrismaModule } from './infra/prisma/prisma.module';
import { BlockedUserModule } from './modules/blocked-users/blocked-users.module';
import { TokenModule } from './modules/token/token.module';
import { UsersModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/user/.env',
    }),
    ConfigModule.forFeature(appConfig),
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (pinoConf: ConfigType<typeof pinoConfig>) => pinoConf,
    }),
    PrismaModule,
    UsersModule,
    BlockedUserModule,
    TokenModule,
  ],
})
export class AppModule {}
