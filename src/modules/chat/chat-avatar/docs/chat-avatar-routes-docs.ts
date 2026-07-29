import { applyDecorators } from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiFileUploadDocs } from '../../../../common/decorators/docs/file';

export class ChatAvatarRoutes {
  static UpdateAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update current chat avatar',
        description: 'Upload a new avatar image for the chat',
      }),
      ApiFileUploadDocs('Avatar image file'),
      ApiOkResponse({ description: 'Avatar updated successfully' }),
    );
  }

  static DeleteChatAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user avatar',
        description: 'Removes avatar of the authenticated user',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
    );
  }
}
