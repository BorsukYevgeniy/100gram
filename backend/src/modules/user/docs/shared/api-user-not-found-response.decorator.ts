import { ApiNotFoundResponse } from '@nestjs/swagger';

export function ApiUserNotFoundResponse() {
  return ApiNotFoundResponse({ description: 'User not found' });
}
