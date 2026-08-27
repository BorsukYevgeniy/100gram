import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiFileUploadDocs(description: string) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description,
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
    }),
    ApiBadRequestResponse({ description: 'Invalid file type or size' }),
  );
}
