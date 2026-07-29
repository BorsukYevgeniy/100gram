import { ApiBadRequestResponse } from '@nestjs/swagger';

export function ApiChatMustBeGroupResponse() {
  return ApiBadRequestResponse({ description: 'Chat must be a group' });
}
