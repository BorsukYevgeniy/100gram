import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import {
  ApiChatIdDocs,
  ApiChatMustBeGroupResponse,
  ApiYouMustBeChatOwnerResponse,
} from '../../docs/shared';

export function ChatAvatarControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Avatar'),
    ApiChatIdDocs(),
    ApiVerifiedAuthDocs(),
    ApiYouMustBeChatOwnerResponse(),
    ApiChatMustBeGroupResponse(),
  );
}
