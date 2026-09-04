import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiMessageIdDocs } from '../../docs/shared';

export function MessageReactionControllerDocs() {
  return applyDecorators(
    ApiTags('Message Reaction'),
    ApiVerifiedAuthDocs(),
    ApiForbiddenResponse({
      description: 'User is not allowed to react to this message',
    }),
    ApiMessageIdDocs(),
  );
}
