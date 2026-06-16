import { ApiBadRequestResponse } from '@nestjs/swagger';

export function ApiInvalidDto() {
  return ApiBadRequestResponse({ description: 'Invalid input data' });
}
