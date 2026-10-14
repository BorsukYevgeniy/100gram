import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileService } from './file.service';

@Injectable()
export class FileCleanUpService {
  constructor(private readonly fileService: FileService) {}

  @Cron('0 * * * *')
  async deleteUnusedFiles() {
    return this.fileService.deleteUnusedFiles();
  }
}
