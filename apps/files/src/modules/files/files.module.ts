import { Module } from '@nestjs/common';
import { MinioModule } from '../../infra/minio/minio.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [MinioModule],
  providers: [FilesService],
  controllers: [FilesController],
})
export class FilesModule {}
