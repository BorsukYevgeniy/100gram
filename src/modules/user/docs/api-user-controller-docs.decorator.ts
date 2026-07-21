import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
} from '../../../common/decorators/docs/auth';
import { ApiUserNotFoundResponse } from './shared';

export function ApiUserControllerDocs() {
  return applyDecorators(
    ApiTags('User'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiUserNotFoundResponse(),
  );
}
