import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileRepository } from './file.repository';
import { FileStorage } from './file.storage';

@Injectable()
export class FileCleanUpService {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  @Cron('0 * * * *')
  async deleteUnusedFiles() {
    const unusedFiles = await this.fileRepo.findUnusedFiles();

    const fileNames = unusedFiles.map(({ name }) => name);

    await this.fileStorage.unlinkFiles(fileNames);
    await this.fileRepo.deleteUnusedFiles();
  }
}
