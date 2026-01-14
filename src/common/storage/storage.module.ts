import { Module } from '@nestjs/common';
import { FileStorage } from './file.storage';

@Module({
  providers: [FileStorage],
  exports: [FileStorage],
})
export class FileStorageModule {}
