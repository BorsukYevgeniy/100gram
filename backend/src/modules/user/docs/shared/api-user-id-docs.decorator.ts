import { applyDecorators } from '@nestjs/common';
import { ApiUserIdParamDocs } from './api-user-id-param-docs.decorator';
import { ApiUserNotFoundResponse } from './api-user-not-found-response.decorator';

export function ApiUserIdDocs() {
  return applyDecorators(ApiUserIdParamDocs(), ApiUserNotFoundResponse());
}
