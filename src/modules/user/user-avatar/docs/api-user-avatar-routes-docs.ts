import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ApiAdminAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiFileUploadDocs } from '../../../../common/decorators/docs/file';
import { ApiUserIdParamDocs } from '../../docs/shared';

export class ApiUserAvatarRoutesDocs {
  static UpdateAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update current user avatar',
        description: 'Upload a new avatar image for the authenticated user',
      }),
      ApiFileUploadDocs('Avatar image file'),
      ApiOkResponse({ description: 'Avatar updated successfully' }),
    );
  }

  static DeleteMyAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user avatar',
        description: 'Removes avatar of the authenticated user',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
    );
  }

  static DeleteUserAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete user avatar (admin only)',
        description: 'Allows admin to delete avatar of any user by userId',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiAdminAuthDocs(),
      ApiUserIdParamDocs(),
    );
  }
}
