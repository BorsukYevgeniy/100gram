import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { File } from '../../../generated/prisma/client';
import { FileRepository } from './file.repository';

import { extname } from 'path';
import { FileStorage } from '../../common/storage/file.storage';

@Injectable()
export class FileService {
  constructor(
    private readonly fileRepo: FileRepository,
    private readonly fileStorage: FileStorage,
  ) {}

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
      return this.fileStorage.writeMessageFile(fileName, f.buffer);
    });

    try {
      await Promise.all(savePromises);
      return this.fileRepo.createFiles(fileNames, userId, messageId);
    } catch (e) {
      await this.fileStorage.unlinkMessageFiles(fileNames);
    }
  }
}
