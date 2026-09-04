import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiYouMustBeChatOwnerResponse() {
  return ApiForbiddenResponse({
    description: 'You must be an owner of chat',
  });
}
