import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Role, User } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';

import { User as UserFromReq } from '../../common/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:id')
  async assignAdmin(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.assignAdmin(id);
  }

  @UseGuards(AuthGuard)
  @Delete('me')
  async deleteMe(@UserFromReq() user: AccessTokenPayload): Promise<User> {
    return await this.userService.delete(user.id);
  }

  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.delete(id);
  }
}
