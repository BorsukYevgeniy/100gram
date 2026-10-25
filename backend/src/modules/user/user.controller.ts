import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../common/types';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UserService } from './user.service';

import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UserNoCredOtpVCode } from './types/user.types';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiUserControllerDocs()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiUserRoutesDocs.Search()
  @UseGuards(AuthGuard)
  @Get('search')
  async searchUser(
    @Query() dto: SearchUserDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.userService.searchUser(dto, pagination);
  }

  @ApiUserRoutesDocs.GetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.userId);
  }

  @ApiUserRoutesDocs.GetById()
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  @ApiUserRoutesDocs.GetPublicProfile()
  @UseGuards(AuthGuard)
  @Get(':userId/public-profile')
  async getPublicProfile(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.userService.findPublicProfileById(userId);
  }

  @ApiUserRoutesDocs.AssignAdmin()
  @UseGuards(AdminGuard)
  @Patch('assign-admin/:userId')
  async assignAdmin(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  @ApiUserRoutesDocs.UpdateUserProfile()
  @UseGuards(AuthGuard)
  @Patch('me')
  async updateMyProfile(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.updateProfile(userId, dto);
  }

  @ApiUserRoutesDocs.DeleteMe()
  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(user, user.userId);
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
