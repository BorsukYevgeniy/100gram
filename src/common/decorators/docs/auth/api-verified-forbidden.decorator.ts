import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiVerifiedForbidden() {
  return ApiForbiddenResponse({
    description: 'You must be a verified user to access this resource',
  });
}
