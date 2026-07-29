import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiUserNotFoundResponse } from '../../docs/shared';

export function ApiUserAvatarControllerDocs() {
  return applyDecorators(
    ApiTags('User Avatar'),
    ApiVerifiedAuthDocs(),
    ApiUserNotFoundResponse(),
  );
}
