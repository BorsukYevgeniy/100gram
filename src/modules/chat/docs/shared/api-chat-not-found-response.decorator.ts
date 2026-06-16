import { ApiNotFoundResponse } from '@nestjs/swagger';

export function ApiChatNotFoundResponse() {
  return ApiNotFoundResponse({ description: 'Chat not found' });
}
