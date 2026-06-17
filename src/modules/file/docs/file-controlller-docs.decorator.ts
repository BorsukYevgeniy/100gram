import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../common/decorators/docs/auth';

export function FileControllerDocs() {
  return applyDecorators(
    ApiTags('File'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
