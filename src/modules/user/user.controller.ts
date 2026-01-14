import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';

import { User as UserFromReq } from '../../common/decorators/routes/user.decorator';
import { UserNoCredVCode } from './types/user.types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:id')
  async assignAdmin(@Param('id') id: number): Promise<UserNoCredVCode> {
    return this.userService.assignAdmin(id);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteMe(
    @UserFromReq() user: AccessTokenPayload,
  ): Promise<UserNoCredVCode> {
    return this.userService.delete(user, user.id);
  }

  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteUserById(
    @UserFromReq() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserNoCredVCode> {
    return this.userService.delete(user, id);
  }
}
