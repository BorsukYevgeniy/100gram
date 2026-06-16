import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../../common/types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { BlockedUserService } from './blocked-user.service';
import { ApiBlockedUserControllerDocs, ApiBlockedUserRouterDocs } from './docs';

@ApiBlockedUserControllerDocs()
@Controller('users')
@UseGuards(AuthGuard)
export class BlockedUserController {
  constructor(private readonly blockedUserService: BlockedUserService) {}

  @ApiBlockedUserRouterDocs.GetMyBlockedUsers()
  @Get('me/blocked')
  async getMyBlockedUsers(@CurrentUser() user: AccessTokenPayload) {
    return this.blockedUserService.getMyBlockedUsers(user.id);
  }
  @ApiBlockedUserRouterDocs.BlockUser()
  @Post('block/:blockedId')
  async blockUser(
    @Param('blockedId') blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.blockUser(user.id, blockedId);
  }

  @ApiBlockedUserRouterDocs.UnBlockUser()
  @Delete('block/:blockedId')
  async unblockUser(
    @Param('blockedId') blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.unblockUser(user.id, blockedId);
  }
}
