import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

import { ApiAdminAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiAvatarUploadDocs } from '../../../../common/decorators/docs/file';
import { ApiUserIdParamDocs } from '../../docs/shared';

export class ApiUserAvatarRoutesDocs {
  static UpdateAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update current user avatar',
        description: 'Upload a new avatar image for the authenticated user',
      }),
      ApiAvatarUploadDocs('Avatar image file'),
      ApiOkResponse({ description: 'Avatar updated successfully' }),
    );
  }

  static DeleteMyAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user avatar',
        description:
          'Removes the custom avatar of the authenticated user. The default avatar cannot be deleted.',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiBadRequestResponse({
        description: 'User not found or does not have a custom avatar',
      }),
    );
  }

  static DeleteUserAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete user avatar (admin only)',
        description:
          'Allows an admin to remove a user’s custom avatar by userId. The default avatar cannot be deleted.',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiBadRequestResponse({
        description:
          'Invalid userId, user not found, or user does not have a custom avatar',
      }),
      ApiAdminAuthDocs(),
      ApiUserIdParamDocs(),
    );
  }
}
