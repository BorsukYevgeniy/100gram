import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { File } from '../../../generated/prisma/client';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { FileService } from './file.service';

@ApiTags('File')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@UseGuards(VerifiedUserGuard)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({
    summary: 'Upload file',
    description: 'Upload file in a server',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Files updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file type or size' })
  @Post('upload')
  @UseInterceptors(MessageFilesInterceptor)
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<File[]> {
    return this.fileService.createFiles(files, user.id);
  }
}
