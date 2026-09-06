import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { CreateFileInput } from '@app/contracts/files/types';
import { MinioService } from '../../infra/minio/minio.service';

@Injectable()
export class FilesService {
  constructor(private readonly minioService: MinioService) {}

  async createFiles(files: CreateFileInput[], key: string): Promise<string[]> {
    //: Promise<File[]> {
    if (!files || files.length === 0) return [];

    const fileNames = [];

    const savePromises = files.map(({ originalname, buffer }) => {
      const fileName = randomUUID().concat(extname(originalname));

      const objectKey = `${key}${fileName}`;

      fileNames.push(objectKey);
      return this.minioService.upload(Buffer.from(buffer, 'base64'), objectKey);
    });

    try {
      await Promise.all(savePromises);
      // this.logger.info({ fileNames, messageId }, 'Files saved successfuly');
      return fileNames;
    } catch (e) {
      await Promise.all(
        fileNames.map((f) => {
          this.minioService.delete(f);
        }),
      );
      throw e;
    }
  }
}

