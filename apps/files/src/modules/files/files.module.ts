import { Module } from '@nestjs/common';
import { MinioModule } from '../../infra/minio/minio.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

@Module({
  imports: [MinioModule, PrismaModule],
  providers: [FilesService, FilesRepository],
  controllers: [FilesController],
})
export class FilesModule {}
