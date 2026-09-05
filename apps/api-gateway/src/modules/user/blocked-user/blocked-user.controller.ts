import { AccessTokenPayload } from '@app/contracts//auth';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
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
    return this.blockedUserService.getMyBlocked(user.id);
  }

  @ApiBlockedUserRouterDocs.BlockUser()
  @Post('block/:blockedId')
  async blockUser(
    @Param('blockedId', ParseIntPipe) blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.block(user.id, blockedId);
  }

  @ApiBlockedUserRouterDocs.UnBlockUser()
  @Delete('block/:blockedId')
  async unblockUser(
    @Param('blockedId', ParseIntPipe) blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.unblock(user.id, blockedId);
  }
}
