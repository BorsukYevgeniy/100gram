import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
} from '../../../common/decorators/docs/auth';
import { ApiMessageNotFound, MessageIdParamDocs } from './shared';

export function MessageControllerDocs() {
  return applyDecorators(
    ApiTags('Message'),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiForbiddenResponse({
      description:
        'You must be a verified user to access this resource and you must be owner of message',
    }),
    ApiMessageNotFound(),
    MessageIdParamDocs(),
  );
}
