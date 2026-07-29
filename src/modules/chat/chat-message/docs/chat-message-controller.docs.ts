import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../../common/decorators/docs/auth';
import { ApiChatIdParamDocs, ApiChatNotFoundResponse } from '../../docs/shared';

export function ChatMessageControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Message'),
    ApiChatIdParamDocs(),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse({
      description: 'You must be a participant of chat or owner of the channel',
    }),
    ApiVerifiedForbidden(),
    ApiChatNotFoundResponse(),
  );
}
