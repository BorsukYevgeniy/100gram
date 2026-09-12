import { FilePattern } from '@app/contracts/files/pattern/file.pattern';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateFilePayload,
  DeleteFilePayload,
} from '../../../../../libs/contracts/src/files/payload';
import { File } from '../../../../../libs/contracts/src/files/types/file.type';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly service: FilesService) {}

  // @MessagePattern(FilePattern.GET_FILE)
  // async getFileUrl(@Payload() fileId: string): Promise<string> {
  //   return this.service.getFileData(fileId);
  // }

  @MessagePattern(FilePattern.CREATE_FILE)
  async create(@Payload() { files, dto }: CreateFilePayload) {
    return this.service.createFiles(files, dto);
  }

  @MessagePattern(FilePattern.DELETE_FILE)
  async delete(
    @Payload() { names, fileType }: DeleteFilePayload,
  ): Promise<File[]> {
    return this.service.deleteFiles(names, fileType);
  }
}
