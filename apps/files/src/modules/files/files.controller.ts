import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilePattern } from '@app/contracts/files/pattern/file.pattern';
import { CreateFilePayload } from '@app/contracts/files/payload/create-file.payload';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @MessagePattern(FilePattern.CREATE_FILE)
  async create(@Payload() { files, key }: CreateFilePayload) {
    return this.service.createFiles(files, key);
  }
}

