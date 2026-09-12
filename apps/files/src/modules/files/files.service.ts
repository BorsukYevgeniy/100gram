import { CreateFileInput } from '@app/contracts/files/types';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { extname } from 'path';
import { CreateFileDto } from '../../../../../libs/contracts/src/files/dto/create-file.dto';
import { FileTypeEnum } from '../../../../../libs/contracts/src/files/enum';
import { File } from '../../../../../libs/contracts/src/files/types/file.type';
import { FileType } from '../../../generated/prisma/enums';
import { MinioService } from '../../infra/minio/minio.service';
import { FilesRepository } from './files.repository';

@Injectable()
export class FilesService {
  constructor(
    private readonly minioService: MinioService,
    private readonly filesRepo: FilesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FilesService.name);
  }

  private getKey(type: FileType) {
    switch (type) {
      case FileTypeEnum.ATTACHMENT:
        return 'attachments/';
      case FileTypeEnum.CHAT_AVATAR:
        return 'avatars/chats/';
      case FileTypeEnum.USER_AVATAR:
        return 'avatars/users/';
    }
  }

  // async getFileData(fileId: string): Promise<string> {
  //   const { name, fileType } = await this.filesRepo.findFile(fileId);

  //   return this.minioService.get(this.getKey(fileType) + name);
  // }

  async createFiles(
    files: CreateFileInput[],
    dto: CreateFileDto,
  ): Promise<File[]> {
    if (!files || files.length === 0) return [];

    const uploadPromises = [];
    const savePromises: Promise<File>[] = [];
    const deletePromises = [];

    files.forEach(({ buffer, originalname }) => {
      const fileId = randomUUID();
      const fileName = fileId.concat(extname(originalname));
      const name = `${this.getKey(dto.fileType)}${fileName}`;

      uploadPromises.push(
        this.minioService.upload(Buffer.from(buffer, 'base64'), name),
      );
      savePromises.push(this.filesRepo.create(name, dto));
      deletePromises.push(this.minioService.delete(name));
    });

    try {
      await Promise.all(uploadPromises);

      const files = await Promise.all(savePromises);

      this.logger.info(
        {
          fileNames: files.map(({ name }) => name),
          fileType: dto.fileType,
        },
        'Files saved successfuly',
      );

      return files;
    } catch (e) {
      await Promise.all(deletePromises);
      this.logger.error(
        {
          fileNames: files.map(({ originalname }) => originalname),
          fileType: dto.fileType,
        },
        'Cannot create files',
      );
      throw e;
    }
  }

  async deleteFiles(names: string[], fileType: FileTypeEnum) {
    if (!names || names.length === 0) return [];

    const deletePromises = [];
    const removePromises: Promise<File>[] = [];

    names.forEach((filename) => {
      deletePromises.push(
        this.minioService.delete(this.getKey(fileType) + filename),
      );

      removePromises.push(this.filesRepo.delete(filename));
    });

    try {
      await Promise.all(deletePromises);

      const files = await Promise.all(removePromises);

      this.logger.info(
        {
          fileNames: names,
          fileType: fileType,
        },
        'Files deleted successfuly',
      );

      return files;
    } catch (e) {
      this.logger.error(
        {
          fileNames: names,
          fileType: fileType,
        },
        'Cannot delete files',
      );

      throw e;
    }
  }
}
