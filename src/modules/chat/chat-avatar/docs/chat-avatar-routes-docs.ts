import { applyDecorators } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiAvatarFileDocs } from '../../../../common/decorators/docs/avatar';
import { ApiChatNotFoundResponse } from '../../docs/shared/api-chat-not-found-response.decorator';

export class ChatAvatarRoutes {
  static UpdateAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update current chat avatar',
        description: 'Upload a new avatar image for the chat',
      }),
      ApiAvatarFileDocs(),
      ApiOkResponse({ description: 'Avatar updated successfully' }),
      ApiChatNotFoundResponse(),
    );
  }

  static DeleteChatAvatar() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user avatar',
        description: 'Removes avatar of the authenticated user',
      }),
      ApiNoContentResponse({ description: 'Avatar deleted successfully' }),
      ApiForbiddenResponse({
        description: 'You are not owner of this chat',
      }),
      ApiChatNotFoundResponse(),
    );
  }
}
