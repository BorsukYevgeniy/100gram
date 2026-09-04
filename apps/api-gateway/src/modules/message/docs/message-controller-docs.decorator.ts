import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiMessageIdDocs } from './shared';

export function MessageControllerDocs() {
  return applyDecorators(
    ApiTags('Message'),
    ApiVerifiedAuthDocs(),
    ApiForbiddenResponse({
      description: 'You must be an owner of the message',
    }),
    ApiMessageIdDocs(),
  );
}
