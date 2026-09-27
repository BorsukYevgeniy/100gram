import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../common/types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserService } from './user.service';

import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UserNoCredOtpVCode } from './types/user.types';

import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';

@ApiUserControllerDocs()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiUserRoutesDocs.GetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.id);
  }

  @ApiUserRoutesDocs.GetById()
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  @ApiUserRoutesDocs.AssignAdmin()
  @UseGuards(AdminGuard)
  @Patch('assign-admin/:userId')
  async assignAdmin(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  @ApiUserRoutesDocs.DeleteMe()
  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(user, user.id);
  }

  @ApiUserRoutesDocs.DeleteUser()
  @UseGuards(AdminGuard)
  @Delete(':userId')
  async deleteUserById(
    @CurrentUser() user: AccessTokenPayload,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(user, userId);
  }
}
