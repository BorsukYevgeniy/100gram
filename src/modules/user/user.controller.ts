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

import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('User')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns user by provided userId',
  })
  @ApiOkResponse({ description: 'User fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'The ID of the user',
    required: true,
  })
  @UseGuards(AuthGuard)
  @Get(':userId')
  async getById(@Param('userId') userId: number): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns authenticated user profile',
  })
  @ApiOkResponse({ description: 'My account fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.id);
  }

  @ApiOperation({
    summary: 'Assign admin role',
    description: 'Grants admin role to a user (admin only)',
  })
  @ApiOkResponse({ description: 'Admin assigned successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden resourse' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'The ID of the user',
    required: true,
  })
  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:id')
  async assignAdmin(@Param('id') id: number): Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(id);
  }

  @ApiOperation({
    summary: 'Delete current user',
    description: 'Deletes authenticated user account',
  })
  @ApiOkResponse({ description: 'My account deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteMe(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(user, user.id);
  }

  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Deletes user by ID (admin only)',
  })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden resourse' })
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'The ID of the user',
    required: true,
  })
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
