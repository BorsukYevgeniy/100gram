import { ApiParam } from '@nestjs/swagger';

export function MessageIdParamDocs() {
  return ApiParam({
    name: 'messageId',
    type: Number,
    required: true,
    description: 'ID of message',
  });
}
