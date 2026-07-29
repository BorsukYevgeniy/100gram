import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

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
      ApiFileUploadDocs('Files for uploading to server'),
      ApiOkResponse({ description: 'Files updated successfully' }),
    );
  }
}
