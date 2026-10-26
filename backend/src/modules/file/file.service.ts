import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { File, FileType } from '../../../generated/prisma/client';
import { FileRepository } from './file.repository';

import { NoSuchKey } from '@aws-sdk/client-s3';
import { PinoLogger } from 'nestjs-pino';
import { extname } from 'path';
import { MinioService } from '../../infra/minio/minio.service';
import { CreateFileDto } from './dto/create-file.dto';

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
        return 'attachments/';
      case FileType.CHAT_AVATAR:
        return 'avatars/chats/';
      case FileType.USER_AVATAR:
        return 'avatars/users/';
    }
  }

  getFileUrl(filename: string, filetype: FileType) {
    return this.getKey(filetype) + filename;
  }

  async getFileContent(key: string) {
    try {
      return await this.minio.get(key);
    } catch (e) {
      if (e instanceof NoSuchKey) {
        this.logger.warn({ key }, 'File not found');
        throw new NotFoundException('File not found');
      }
    }
  }

  async createFiles(
    files: Express.Multer.File[],
    filesType: FileType,
  ): Promise<File[]> {
    if (!files || files.length === 0) return [];

    const fileNames: string[] = [];
    const createFileDtos: CreateFileDto[] = [];

    const savePromises = files.map((f) => {
      const fileName = randomUUID().concat(extname(f.originalname));

      fileNames.push(fileName);

      createFileDtos.push({
        name: fileName,
        fileType: filesType,
        originalName: f.originalname,
      });

      return this.minio.upload(
        this.getFileUrl(fileName, filesType),
        f.buffer,
        f.mimetype,
      );
    });

    try {
      await Promise.all(savePromises);

      const files = this.fileRepo.createFiles(createFileDtos);

      this.logger.debug(
        { fileNames, fileType: filesType },
        'Files saved successfuly',
      );
      return files;
    } catch (e) {
      await Promise.all(
        fileNames.map((f) => this.minio.delete(this.getFileUrl(f, filesType))),
      );

      this.logger.error({ fileNames, filesType }, 'Cannot create files');

      throw e;
    }
  }

  async deleteFiles(filenames: string[], filesType: FileType) {
    try {
      await this.fileRepo.deleteFiles(filenames);

      await Promise.all(
        filenames.map((f) => {
          return this.minio.delete(this.getFileUrl(f, filesType));
        }),
      );

      this.logger.debug({ filenames, filesType }, 'Files deleted');
    } catch (e) {
      this.logger.error(
        {
          filenames,
          filesType,
        },
        'Cannot delete files',
      );

      throw e;
    }
  }

  async deleteUnusedFiles() {
    const unusedFiles = await this.fileRepo.findUnusedFiles();

    await Promise.all(
      unusedFiles.map(({ fileType, name }) =>
        this.minio.delete(this.getFileUrl(name, fileType)),
      ),
    );
    const { count } = await this.fileRepo.deleteUnusedFiles();
    this.logger.info({ count }, 'Deleted unused files');
  }
}
