import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiParam } from '@nestjs/swagger';

export function ApiMessageIdDocs() {
  return applyDecorators(
    ApiParam({
      name: 'messageId',
      type: Number,
      required: true,
      description: 'ID of message',
    }),
    ApiNotFoundResponse({ description: 'Message not found' }),
  );
}
