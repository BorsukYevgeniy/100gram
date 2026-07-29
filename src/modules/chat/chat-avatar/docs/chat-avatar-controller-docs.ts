import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import {
  ApiChatMustBeGroupResponse,
  ApiChatNotFoundResponse,
  ApiYouMustBeChatOwnerResponse,
} from '../../docs/shared';
import { ApiChatIdParamDocs } from '../../docs/shared/api-chat-id-docs.decorator';

export function ChatAvatarControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Avatar'),
    ApiChatIdParamDocs(),
    ApiVerifiedAuthDocs(),
    ApiChatNotFoundResponse(),
    ApiYouMustBeChatOwnerResponse(),
    ApiChatMustBeGroupResponse(),
  );
}
