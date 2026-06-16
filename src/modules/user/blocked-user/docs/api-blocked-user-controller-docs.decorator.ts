import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
} from '../../../../common/decorators/docs/auth';

export function ApiBlockedUserControllerDocs() {
  return applyDecorators(
    ApiTags('Blocked User'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
  );
}
