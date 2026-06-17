import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiFileUploadDocs } from '../../../common/decorators/docs/file';

export function UploadFileRouteDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Upload file',
      description: 'Upload file in a server',
    }),
    ApiFileUploadDocs('File for message'),
    ApiOkResponse({ description: 'Files updated successfully' }),
  );
}
