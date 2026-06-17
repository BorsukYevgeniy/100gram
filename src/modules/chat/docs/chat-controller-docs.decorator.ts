import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../common/decorators/docs/auth';

export function ChatControllerDocs() {
  return applyDecorators(
    ApiTags('Chat'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
