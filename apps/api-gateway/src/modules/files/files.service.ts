import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateFileDto } from '../../../../../libs/contracts/src/files/dto/create-file.dto';
import { FileTypeEnum } from '../../../../../libs/contracts/src/files/enum';
import { FilePattern } from '../../../../../libs/contracts/src/files/pattern/file.pattern';
import { CreateFilePayload } from '../../../../../libs/contracts/src/files/payload';
import { DeleteFilePayload } from '../../../../../libs/contracts/src/files/payload/delete-file.payload';
import { File } from '../../../../../libs/contracts/src/files/types/file.type';
import { FILES_CLIENT } from '../../common/client/files/files-client.constants';

@Injectable()
export class FilesService {
  constructor(@Inject(FILES_CLIENT) private readonly fileClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: FilePattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.fileClient.send<TOut, TIn>(pattern, input));
  }

  // async getFileData(fileId: number) {
  //   return this.send<File, number>(FilePattern.GET_FILE, fileId);
  // }

  async create(files: Express.Multer.File[], dto: CreateFileDto) {
    return this.send<File[], CreateFilePayload>(FilePattern.CREATE_FILE, {
      files: files.map(({ buffer, originalname, mimetype, size }) => ({
        buffer: buffer.toString('base64'),
        originalname,
        size,
        mimetype,
      })),
      dto,
    });
  }

  async delete(fileNames: string[], fileType: FileTypeEnum) {
    return this.send<File[], DeleteFilePayload>(FilePattern.DELETE_FILE, {
      names: fileNames,
      fileType,
    });
  }
}
