import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../../generated/prisma/client';
import { Role } from '../../common/enum/role.enum';
import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @RequiredRoles([Role.ADMIN])
  @UseGuards(RolesGuard)
  @Patch('assign-admin/:id')
  async assignAdmin(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return await this.userService.assignAdmin(id);
  }
}
