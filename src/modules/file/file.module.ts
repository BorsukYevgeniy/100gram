import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { FileController } from './file.controller';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';
import { FileStorage } from './file.storage';

@Module({
  imports: [PrismaModule, TokenModule, ScheduleModule.forRoot()],
  providers: [FileStorage, FileService, FileRepository],
  exports: [FileService],
  controllers: [FileController],
})
export class FileModule {}
