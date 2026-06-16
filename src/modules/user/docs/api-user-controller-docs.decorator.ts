import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
} from '../../../common/decorators/docs/auth';

export function ApiUserControllerDocs() {
  return applyDecorators(
    ApiTags('User'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
  );
}
