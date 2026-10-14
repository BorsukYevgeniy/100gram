import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiUserNotFoundResponse } from './shared';

export function ApiUserControllerDocs() {
  return applyDecorators(
    ApiTags('User'),
    ApiAuthDocs(),
    ApiUserNotFoundResponse(),
  );
}
