import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiChatIdParamDocs, ApiChatNotFoundResponse } from '../../docs/shared';

export function ChatMessageControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Message'),
    ApiChatIdParamDocs(),
    ApiVerifiedAuthDocs(),
    ApiForbiddenResponse({
      description: 'You must be a participant of chat or owner of the channel',
    }),
    ApiChatNotFoundResponse(),
  );
}
