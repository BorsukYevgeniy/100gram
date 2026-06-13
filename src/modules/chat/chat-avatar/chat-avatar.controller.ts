import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AvatarInterceptor } from '../../../common/interceptor/avatar.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { ChatAvatarService } from './chat-avatar.service';

@ApiTags('Chat Avatar')
@ApiParam({
  name: 'chatId',
  type: Number,
  required: true,
  description: 'ID of chat',
})
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({
  description: 'You must be authorized to access this resource',
})
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@Controller('chats/:chatId')
@UseGuards(VerifiedUserGuard)
export class ChatAvatarController {
  constructor(private readonly chatAvatarService: ChatAvatarService) {}

  @ApiOperation({
    summary: 'Update current chat avatar',
    description: 'Upload a new avatar image for the chat',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Avatar updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file type or size' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @Patch('avatar')
  @UseInterceptors(AvatarInterceptor)
  async updateMyAvatar(
    @Param('chatId') chatId: number,
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chatAvatarService.updateAvatar(chatId, user, file);
  }

  @ApiOperation({
    summary: 'Delete current user avatar',
    description: 'Removes avatar of the authenticated user',
  })
  @ApiNoContentResponse({ description: 'Avatar deleted successfully' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiForbiddenResponse({
    description: 'You are not admin or owner of this chat',
  })
  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAvatar(
    @Param('chatId') chatId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.chatAvatarService.deleteAvatar(chatId, user);
  }
}
