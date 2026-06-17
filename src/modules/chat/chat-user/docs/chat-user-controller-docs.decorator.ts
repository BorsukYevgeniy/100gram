import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../../common/decorators/docs/auth';
import { ApiChatIdParamDocs } from '../../docs/shared';

export function ChatUserControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Message'),
    ApiChatIdParamDocs(),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
