import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiYouMustBeChatOwnerResponse() {
  return ApiForbiddenResponse({
    description: 'You must be a chat owner or an admin',
  });
}
