import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { RolesGuard } from '../auth/guard/roles.guard';
// import { Role } from '../../../generated/prisma/client';
// import { AccessTokenPayload } from '../../common/types';
// import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
// import { AuthGuard } from '../auth/guards/auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { UserService } from './user.service';

// import { UserNoCredOtpVCode } from '../../../../users/src/modules/users/types/user.types';
// import { CurrentUser } from '../../common/decorators/routes/user.decorator';

// import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';
import { AccessTokenPayload, Roles } from '@app/contracts/auth';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';
import { UserService } from './user.service';

// @ApiUserControllerDocs()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @ApiUserRoutesDocs.GetById()
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(@Param('userId', ParseIntPipe) userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.getUserById(userId);
  }

  // @ApiUserRoutesDocs.GetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: AccessTokenPayload) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.getUserById(user.id);
  }

  // @ApiUserRoutesDocs.AssignAdmin()
  @RequiredRoles([Roles.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:userId')
  async assignAdmin(@Param('userId') userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  // @ApiUserRoutesDocs.DeleteMe()
  // @UseGuards(AuthGuard)
  // @Delete('me')
  // async deleteMe(
  //   @CurrentUser() user: AccessTokenPayload,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, user.id);
  // }

  // @ApiUserRoutesDocs.DeleteUser()
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  // @Delete(':userId')
  // async deleteUserById(
  //   @CurrentUser() user: AccessTokenPayload,
  //   @Param('userId') userId: number,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, userId);
  // }
}
