import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { File, FileType } from '../../../generated/prisma/client';
import { FileRepository } from './file.repository';

import { PinoLogger } from 'nestjs-pino';
import { extname } from 'path';
import { MinioService } from '../../infra/minio/minio.service';

@Injectable()
export class FileService {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly minio: MinioService,
    private readonly logger: PinoLogger,
  ) {
    logger.setContext(FileService.name);
  }

  private getKey(fileType: FileType) {
    switch (fileType) {
      case FileType.ATTACHMENT:
        return 'attacments/';
      case FileType.CHAT_AVATAR:
        return 'avatars/chats/';
      case FileType.USER_AVATAR:
        return 'avatars/users/';
    }
  }

  async createFiles(
    files: Express.Multer.File[],
    fileType: FileType,
  ): Promise<File[]> {
    if (!files || files.length === 0) return [];

    const fileNames = [];

    const savePromises = files.map((f) => {
      const fileName = randomUUID().concat(extname(f.originalname));

      fileNames.push(fileName);
      return this.minio.upload(this.getKey(fileType) + fileName, f.buffer);
    });

    try {
      await Promise.all(savePromises);

      const files = this.fileRepo.createFiles(fileNames, fileType);

      this.logger.info({ fileNames, fileType }, 'Files saved successfuly');
      return files;
    } catch (e) {
      await Promise.all(
        fileNames.map((f) => this.minio.delete(this.getKey(fileType) + f)),
      );
      throw e;
    }
  }

  async deleteFiles(filenames: string[], filesType: FileType) {
    try {
      await this.fileRepo.deleteFiles(filenames);

      await Promise.all(
        filenames.map((f) => {
          return this.minio.delete(this.getKey(filesType) + f);
        }),
      );
    } catch {
      this.logger.error(
        {
          filenames,
          filesType,
        },
        'Cannot delete files',
      );
    }
  }

  async deleteUnusedFiles() {
    const unusedFiles = await this.fileRepo.findUnusedFiles();

    await Promise.all(
      unusedFiles.map(({ fileType, name }) =>
        this.minio.delete(this.getKey(fileType) + name),
      ),
    );
    const { count } = await this.fileRepo.deleteUnusedFiles();
    this.logger.info({ count }, 'Deleted unused files');
  }
}
