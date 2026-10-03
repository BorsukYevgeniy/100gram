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
          files: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            maxItems: 5,
            description: 'Optional attachments: up to 5 files, 200 MB per file',
          },
        },
      },
    }),
    ApiBadRequestResponse({ description: 'Invalid file type or size' }),
  );
}
