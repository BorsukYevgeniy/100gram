import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { FILES_CLIENT } from '../../common/client/files/files-client.constants';
import filesMicroserviceConfig from '../../config/files-microservice.config';
import { FilesService } from './files.service';

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
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
