import { applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAuthCookies,
  ApiUnauthorizedResponse,
  ApiVerifiedForbidden,
} from '../../../../common/decorators/docs/auth';
import { MessageIdParamDocs } from '../../docs/shared';

export function MessageReactionControllerDocs() {
  return applyDecorators(
    ApiTags('Message Reaction'),
    MessageIdParamDocs(),
    ApiAuthCookies(),
    ApiUnauthorizedResponse(),
    ApiVerifiedForbidden(),
  );
}
