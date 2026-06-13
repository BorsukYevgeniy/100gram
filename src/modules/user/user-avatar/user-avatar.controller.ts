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
import { Role } from '../../../../generated/prisma/enums';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AvatarInterceptor } from '../../../common/interceptor/avatar.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { RequiredRoles } from '../../auth/decorator/required-roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { UserAvatarService } from './user-avatar.service';

@ApiTags('User Avatar')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@Controller('users')
@UseGuards(VerifiedUserGuard)
export class UserAvatarController {
  constructor(private readonly userAvatarService: UserAvatarService) {}

  @ApiOperation({
    summary: 'Update current user avatar',
    description: 'Upload a new avatar image for the authenticated user',
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
  @ApiNotFoundResponse({ description: 'User not found' })
  @Patch('me/avatar')
  @UseInterceptors(AvatarInterceptor)
  async updateMyAvatar(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userAvatarService.updateAvatar(user.id, file);
  }

  @ApiOperation({
    summary: 'Delete current user avatar',
    description: 'Removes avatar of the authenticated user',
  })
  @ApiNoContentResponse({ description: 'Avatar deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAvatar(@CurrentUser() user: AccessTokenPayload) {
    return this.userAvatarService.deleteAvatar(user.id);
  }

  @ApiOperation({
    summary: 'Delete user avatar (admin only)',
    description: 'Allows admin to delete avatar of any user by userId',
  })
  @ApiNoContentResponse({ description: 'Avatar deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'The ID of the user',
    required: true,
  })
  @Delete(':userId/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  async deleteUserAvatar(@Param('userId') userId: number) {
    return this.userAvatarService.deleteAvatar(userId);
  }
}
