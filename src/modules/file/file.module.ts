import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MinioModule } from '../../infra/minio/minio.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';

@Module({
  imports: [MinioModule, PrismaModule, TokenModule, ScheduleModule.forRoot()],
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileService],
})
export class FileModule {}
