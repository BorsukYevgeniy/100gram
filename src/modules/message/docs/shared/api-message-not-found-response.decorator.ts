import { ApiNotFoundResponse } from '@nestjs/swagger';

export function ApiMessageNotFound() {
  return ApiNotFoundResponse({ description: 'Message not found' });
}
