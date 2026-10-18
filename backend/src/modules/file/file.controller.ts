import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { basename } from 'path';
import { Readable } from 'stream';
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

  @FileDocs.GetFileContent()
  @Get()
  async getFile(
    @Query('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.fileService.getFileContent(key);

    const filename = basename(key);

    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    console.log(file.contentType);

    return new StreamableFile(
      Readable.from(file.body as AsyncIterable<Uint8Array>),
      {
        type: file.contentType,
        length: file.contentLength,
      },
    );
  }

  @FileDocs.UploadFile()
  @Post('upload')
  @UseInterceptors(MessageFilesInterceptor)
  async upload(@UploadedFiles() files: Express.Multer.File[]): Promise<File[]> {
    return this.fileService.createFiles(files, FileType.ATTACHMENT);
  }
}
