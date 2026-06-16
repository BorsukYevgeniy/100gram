import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../../common/decorators/docs/auth';

export function ApiUserAvatarControllerDocs() {
  return applyDecorators(
    ApiTags('User Avatar'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
