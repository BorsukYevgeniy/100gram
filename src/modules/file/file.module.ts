import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileStorageModule } from '../../common/storage/storage.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';

@Module({
  imports: [
    FileStorageModule,
    PrismaModule,
    TokenModule,
    ScheduleModule.forRoot(),
  ],
  providers: [FileService, FileRepository],
  exports: [FileService],
  controllers: [FileController],
})
export class FileModule {}
