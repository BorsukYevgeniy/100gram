import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiUserNotFoundResponse } from '../../docs/shared';

export function ApiBlockedUserControllerDocs() {
  return applyDecorators(
    ApiTags('Blocked User'),
    ApiAuthDocs(),
    ApiUserNotFoundResponse(),
  );
}
