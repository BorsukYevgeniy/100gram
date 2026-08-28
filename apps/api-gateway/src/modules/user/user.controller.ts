import { Roles } from '@app/contracts/auth';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../common/types';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { UserService } from './user.service';

import { CurrentUser } from '../../common/decorators/routes/user.decorator';

import { UserNoCredOtpVCode } from '../../../../../libs/contracts/src/user/types';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';

@ApiUserControllerDocs()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiUserRoutesDocs.GetById()
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.getById(userId);
  }

  @ApiUserRoutesDocs.GetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.getById(user.id);
  }

  @ApiUserRoutesDocs.AssignAdmin()
  @RequiredRoles([Roles.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:userId')
  async assignAdmin(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
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
  // @RequiredRoles([Roles.ADMIN])
  // @UseGuards(RolesGuard)
  // @Delete(':userId')
  // async deleteUserById(
  //   @CurrentUser() user: AccessTokenPayload,
  //   @Param('userId') userId: number,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, userId);
  // }
}
