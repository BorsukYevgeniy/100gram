import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiAuthDocs } from './api-auth-docs.decorator';

export function ApiAdminAuthDocs() {
  return applyDecorators(
    ApiAuthDocs(),
    ApiForbiddenResponse({
      description: 'You must be an administator to access this resource',
    }),
  );
}
