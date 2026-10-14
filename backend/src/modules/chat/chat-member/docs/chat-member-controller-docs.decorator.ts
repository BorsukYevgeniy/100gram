import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiChatIdDocs } from '../../docs/shared';

export function ChatMemberControllerDocs() {
  return applyDecorators(
    ApiTags('Chat Member'),
    ApiChatIdDocs(),
    ApiVerifiedAuthDocs(),
  );
}
