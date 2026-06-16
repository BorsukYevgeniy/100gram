import { ApiParam } from '@nestjs/swagger';

export function ApiChatIdParamDocs() {
  return ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat',
  });
}
