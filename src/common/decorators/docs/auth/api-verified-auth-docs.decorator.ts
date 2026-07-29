import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiAuthDocs } from './api-auth-docs.decorator';

export function ApiVerifiedAuthDocs() {
  return applyDecorators(
    ApiAuthDocs(),
    ApiForbiddenResponse({
      description: 'You must be a verified user to access this resource',
    }),
  );
}
