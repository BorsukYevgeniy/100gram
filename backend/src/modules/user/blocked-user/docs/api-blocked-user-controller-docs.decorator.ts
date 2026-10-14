import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuthDocs } from '../../../../common/decorators/docs/auth';

export function ApiBlockedUserControllerDocs() {
  return applyDecorators(ApiTags('Blocked User'), ApiAuthDocs());
}
