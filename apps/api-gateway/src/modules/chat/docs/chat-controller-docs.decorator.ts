import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';

export function ChatControllerDocs() {
  return applyDecorators(ApiTags('Chat'), ApiVerifiedAuthDocs());
}
