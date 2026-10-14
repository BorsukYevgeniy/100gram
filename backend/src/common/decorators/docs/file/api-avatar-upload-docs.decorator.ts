import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiAvatarUploadDocs(description: string) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description,
      required: true,
      schema: {
        type: 'object',
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description:
              'Avatar image (.png, .jpg, .jpeg, or .svg), up to 7 MB',
          },
        },
        required: ['avatar'],
      },
    }),
    ApiBadRequestResponse({
      description:
        'Avatar must have a .png, .jpg, .jpeg, or .svg extension and be no larger than 7 MB',
    }),
  );
}
