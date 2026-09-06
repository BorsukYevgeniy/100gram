import {
  Controller,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../../../../../libs/contracts/src/auth';
import { AvatarInterceptor } from '../../../common/interceptor/avatar.interceptor';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guard/verified-auth.guard';
import { ApiUserAvatarControllerDocs, ApiUserAvatarRoutesDocs } from './docs';
import { UserAvatarService } from './user-avatar.service';

@ApiUserAvatarControllerDocs()
@Controller('users')
@UseGuards(VerifiedUserGuard)
export class UserAvatarController {
  constructor(private readonly userAvatarService: UserAvatarService) {}

  @ApiUserAvatarRoutesDocs.UpdateAvatar()
  @Patch('me/avatar')
  @UseInterceptors(AvatarInterceptor)
  async updateMyAvatar(
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userAvatarService.updateAvatar(user.id, file);
  }

  // @ApiUserAvatarRoutesDocs.DeleteMyAvatar()
  // @Delete('me/avatar')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteMyAvatar(@CurrentUser() user: AccessTokenPayload) {
  //   return this.userAvatarService.deleteAvatar(user.id);
  // }

  // @ApiUserAvatarRoutesDocs.DeleteUserAvatar()
  // @Delete(':userId/avatar')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  // async deleteUserAvatar(@Param('userId') userId: number) {
  //   return this.userAvatarService.deleteAvatar(userId);
  // }
}
