import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiFileUploadDocs } from '../../../common/decorators/docs/file';

export class FileDocs {
  static Controller() {
    return applyDecorators(ApiTags('File'), ApiVerifiedAuthDocs());
  }

  static UploadFile() {
    return applyDecorators(
      ApiOperation({
        summary: 'Upload file',
        description: 'Upload file in a server',
      }),
      ApiFileUploadDocs('Files for message'),
      ApiOkResponse({ description: 'Files uploaded successfully' }),
    );
  }

  static GetFileContent() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get file',
        description: 'Get a file from server',
      }),
      ApiOkResponse({ description: 'File getted successfully' }),
      ApiQuery({
        name: 'key',
        type: String,
        description: 'Key of file which you want to get',
        example: '123456-1234-4567-y123-123456789010.jpg',
      }),
    );
  }
}
