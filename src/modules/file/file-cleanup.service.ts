import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileStorage } from '../../common/storage/file.storage';
import { FileRepository } from './file.repository';

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

    await this.fileStorage.unlinkMessageFiles(fileNames);
    await this.fileRepo.deleteUnusedFiles();
  }
}
