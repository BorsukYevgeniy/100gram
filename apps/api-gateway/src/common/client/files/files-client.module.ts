import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import filesMicroserviceConfig from '../../../config/files-microservice.config';
import { FILES_CLIENT } from './files-client.constants';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: FILES_CLIENT,
          imports: [ConfigModule.forFeature(filesMicroserviceConfig)],
          inject: [filesMicroserviceConfig.KEY],
          useFactory: (с: ConfigType<typeof filesMicroserviceConfig>) => с,
        },
      ],
    }),
  ],
  exports: [ClientsModule],
})
export class FilesClientModule {}
