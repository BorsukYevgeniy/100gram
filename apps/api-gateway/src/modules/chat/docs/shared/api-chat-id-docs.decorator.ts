import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';

export function ApiChatIdDocs() {
  return applyDecorators(
    ApiNotFoundResponse({ description: 'Chat not found' }),
    ApiParam({
      name: 'chatId',
      type: Number,
      required: true,
      description: 'ID of chat',
    }),
  );
}
