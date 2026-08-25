import { Controller } from '@nestjs/common';
// import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
// import { AuthGuard } from '../auth/guards/auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { UserService } from './user.service';

// import { UserNoCredOtpVCode } from '../../../../users/src/modules/users/types/user.types';
import { UserService } from './users.service';
// import { CurrentUser } from '../../common/decorators/routes/user.decorator';

// import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';

// @ApiUserControllerDocs()

import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @ApiUserRoutesDocs.GetById()
  // @UseGuards(AuthGuard)
  @MessagePattern('user.getById')
  async getById(@Payload() userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  // @ApiUserRoutesDocs.GetMe()
  // @UseGuards(AuthGuard)
  @MessagePattern('user.getMe')
  async getMe(
    // @CurrentUser() user: AccessTokenPayload,
    user,
  ) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.id);
  }

  // @ApiUserRoutesDocs.AssignAdmin()
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  @MessagePattern('user.assignAdmin')
  async assignAdmin(@Payload() userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  // @ApiUserRoutesDocs.DeleteMe()
  // @UseGuards(AuthGuard)
  // @Delete('me')
  // async deleteMe(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, user.id);
  // }

  // @ApiUserRoutesDocs.DeleteUser()
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  // @Delete(':userId')
  // async deleteUserById(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  //   @Param('userId') userId: number,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, userId);
  // }
}
