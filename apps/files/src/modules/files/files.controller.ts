import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilePattern } from '../../../../../libs/contracts/src/files/pattern/file.pattern';
import { CreateFilePayload } from '../../../../../libs/contracts/src/files/payload/create-file.payload';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @MessagePattern(FilePattern.CREATE_FILE)
  async create(@Payload() { files, key }: CreateFilePayload) {
    return this.service.createFiles(files, key);
  }
}
