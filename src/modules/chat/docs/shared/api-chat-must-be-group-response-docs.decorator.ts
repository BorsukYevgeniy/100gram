import { ApiBadRequestResponse } from '@nestjs/swagger';

export function ApiChatMustBeGroupOrChannelResponse() {
  return ApiBadRequestResponse({
    description: 'Chat must be a group or channel',
  });
}
