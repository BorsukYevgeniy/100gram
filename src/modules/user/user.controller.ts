import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';

import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { UserNoCredOtpVCode } from './types/user.types';

import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';

@ApiUserControllerDocs()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiUserRoutesDocs.GetById()
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(@Param('userId') userId: number): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  @ApiUserRoutesDocs.GetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.id);
  }

  @ApiUserRoutesDocs.AssignAdmin()
  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:id')
  async assignAdmin(@Param('id') id: number): Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(id);
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
  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteUserById(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(user, id);
  }
}
