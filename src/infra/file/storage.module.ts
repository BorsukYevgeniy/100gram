import { Module } from '@nestjs/common';
import { LocalFileStorage } from './file.storage';

@Module({
  providers: [LocalFileStorage],
  exports: [LocalFileStorage],
})
export class FileStorageModule {}
