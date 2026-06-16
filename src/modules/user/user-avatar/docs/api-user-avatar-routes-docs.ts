import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiAdminVerifiedForbidden } from '../../../../common/decorators/docs/auth';

import { ApiAvatarFileDocs } from '../../../../common/decorators/docs/avatar';
import { ApiUserIdParamDocs, ApiUserNotFoundResponse } from '../../docs/shared';

export class ApiUserAvatarRoutesDocs {
  static UpdateAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update current user avatar',
        description: 'Upload a new avatar image for the authenticated user',
      }),
      ApiAvatarFileDocs(),
      ApiOkResponse({ description: 'Avatar updated successfully' }),
      ApiUserNotFoundResponse(),
    );
  }

  static DeleteMyAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user avatar',
        description: 'Removes avatar of the authenticated user',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiUserNotFoundResponse(),
    );
  }

  static DeleteUserAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete user avatar (admin only)',
        description: 'Allows admin to delete avatar of any user by userId',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiAdminVerifiedForbidden(),
      ApiUserNotFoundResponse(),
      ApiUserIdParamDocs(),
    );
  }
}
