import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../common/decorators/docs/auth';
import { ApiMessageNotFound, MessageIdParamDocs } from './shared';

export function MessageControllerDocs() {
  return applyDecorators(
    ApiTags('Message'),
    ApiAuthCookies(),
    ApiMessageNotFound(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
    ApiForbiddenResponse({
      description: 'You must be an owner of the message',
    }),
    MessageIdParamDocs(),
  );
}
