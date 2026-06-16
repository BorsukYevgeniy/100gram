import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../../common/decorators/docs/auth';
import { ApiAuthCookies } from '../../../../common/decorators/docs/auth/api-auth-token.decorator';
import { ApiChatIdParamDocs } from '../../docs/shared/api-chat-id-docs.decorator';

export function ChatAvatarControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Avatar'),
    ApiChatIdParamDocs(),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
