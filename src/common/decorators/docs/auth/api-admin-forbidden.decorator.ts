import { ApiForbiddenResponse } from '@nestjs/swagger';

export function ApiAdminForbidden() {
  return ApiForbiddenResponse({
    description: 'You must be an administator to access this resource',
  });
}
