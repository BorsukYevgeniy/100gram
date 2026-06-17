import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { File } from '../../../generated/prisma/client';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { FileControllerDocs, UploadFileRouteDocs } from './docs';
import { FileService } from './file.service';

@FileControllerDocs()
@UseGuards(VerifiedUserGuard)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UploadFileRouteDocs()
  @Post('upload')
  @UseInterceptors(MessageFilesInterceptor)
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<File[]> {
    return this.fileService.createFiles(files, user.id);
  }
}
