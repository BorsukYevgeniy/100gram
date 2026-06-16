import { ApiParam } from '@nestjs/swagger';

export function ApiBlockedId() {
  return ApiParam({
    name: 'blockedId',
    type: Number,
    description: 'The ID of the user which you want to block',
    required: true,
  });
}
