import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { File } from '../../../generated/prisma/client';
import { FileRepository } from './file.repository';

import { PinoLogger } from 'nestjs-pino';
import { extname, resolve } from 'path';
import { LocalFileStorage } from '../../infra/file/file.storage';

@Injectable()
export class FileService implements OnModuleInit {
  private MESSAGE_FILE_DIR_PATH: string = resolve(
    __dirname,
    '..',
    '..',
    '..',
    'files',
    'messages',
  );

  constructor(
    private readonly fileRepo: FileRepository,
    private readonly fileStorage: LocalFileStorage,
    private readonly logger: PinoLogger,
  ) {
    logger.setContext(FileService.name);
  }

  async onModuleInit() {
    await this.fileStorage.mkdir(this.MESSAGE_FILE_DIR_PATH);
  }

  async createFiles(
    files: Express.Multer.File[],
    userId: number,
    messageId?: number,
  ): Promise<File[]> {
    if (!files || files.length === 0) return [];

    const fileNames = [];

    const savePromises = files.map((f) => {
      const fileName = randomUUID().concat(extname(f.originalname));

      fileNames.push(fileName);
      return this.fileStorage.write(
        fileName,
        this.MESSAGE_FILE_DIR_PATH,
        f.buffer,
      );
    });

    try {
      await Promise.all(savePromises);

      const files = this.fileRepo.createFiles(fileNames, userId, messageId);

      this.logger.info({ fileNames, messageId }, 'Files saved successfuly');
      return files;
    } catch (e) {
      await Promise.all(
        fileNames.map((f) =>
          this.fileStorage.unlink(f, this.MESSAGE_FILE_DIR_PATH),
        ),
      );
      throw e;
    }
  }

  async deleteUnusedFiles() {
    const unusedFiles = await this.fileRepo.findUnusedFiles();

    const fileNames = unusedFiles.map(({ name }) => name);

    await Promise.all(
      fileNames.map((f) =>
        this.fileStorage.unlink(f, this.MESSAGE_FILE_DIR_PATH),
      ),
    );
    const { count } = await this.fileRepo.deleteUnusedFiles();
    this.logger.info({ count }, 'Deleted unused files');
  }
}
