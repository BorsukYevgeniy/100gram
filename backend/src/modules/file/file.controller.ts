import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { File, FileType } from '../../../generated/prisma/client';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { FileDocs } from './docs';
import { FileService } from './file.service';

@FileDocs.Controller()
@UseGuards(VerifiedUserGuard)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @FileDocs.UploadFile()
  @Post('upload')
  @UseInterceptors(MessageFilesInterceptor)
  async upload(@UploadedFiles() files: Express.Multer.File[]): Promise<File[]> {
    return this.fileService.createFiles(files, FileType.ATTACHMENT);
  }
}
