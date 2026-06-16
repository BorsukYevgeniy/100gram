import { ApiUnauthorizedResponse as SwaggerApiUnauthorizedResponse } from '@nestjs/swagger';

export function ApiUnauthorizedResponse() {
  return SwaggerApiUnauthorizedResponse({
    description: 'You must be authorized to access this resource',
  });
}
