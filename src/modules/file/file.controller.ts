import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { File } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/routes/user.decorator';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { FileService } from './file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseGuards(VerifiedUserGuard)
  @UseInterceptors(MessageFilesInterceptor)
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @User() user: AccessTokenPayload,
  ): Promise<File[]> {
    return this.fileService.createFiles(files, user.id);
  }
}
