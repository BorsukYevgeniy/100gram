import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiMessageIdDocs } from './shared';

export function MessageControllerDocs() {
  return applyDecorators(
    ApiTags('Message'),
    ApiVerifiedAuthDocs(),
    ApiMessageIdDocs(),
  );
}
