import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { pinoConfig } from '../../../libs/config/src';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'apps/files/.env',
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(pinoConfig)],
      inject: [pinoConfig.KEY],
      useFactory: (c: ConfigType<typeof pinoConfig>) => c,
    }),
    FilesModule,
  ],
})
export class AppModule {}
