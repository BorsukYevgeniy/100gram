import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../../common/types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { BlockedUserService } from './blocked-user.service';

@Controller('users')
@UseGuards(AuthGuard)
export class BlockedUserController {
  constructor(private readonly blockedUserService: BlockedUserService) {}

  @Get('me/blocked')
  async getMyBlockedUsers(@User() user: AccessTokenPayload) {
    return this.blockedUserService.getMyBlockedUsers(user.id);
  }

  @Post('block/:blockedId')
  async blockUser(
    @Param('blockedId') blockedId: number,
    @User() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.blockUser(user.id, blockedId);
  }

  @Delete('block/:blockedId')
  async unblockUser(
    @Param('blockedId') blockedId: number,
    @User() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.unblockUser(user.id, blockedId);
  }
}
