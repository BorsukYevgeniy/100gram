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
import { Role } from '../../../../generated/prisma/enums';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AvatarInterceptor } from '../../../common/interceptor/avatar.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { RequiredRoles } from '../../auth/decorator/required-roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
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
  @ApiUserAvatarRoutesDocs.DeleteMyAvatar()
  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAvatar(@CurrentUser() user: AccessTokenPayload) {
    return this.userAvatarService.deleteAvatar(user.id);
  }

  @ApiUserAvatarRoutesDocs.DeleteUserAvatar()
  @Delete(':userId/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  async deleteUserAvatar(@Param('userId') userId: number) {
    return this.userAvatarService.deleteAvatar(userId);
  }
}
