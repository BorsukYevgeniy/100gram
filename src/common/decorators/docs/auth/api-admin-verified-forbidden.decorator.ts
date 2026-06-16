import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiAdminVerifiedForbidden() {
  return ApiForbiddenResponse({
    description:
      'You must be an administator and verified user to access this resource',
  });
}
