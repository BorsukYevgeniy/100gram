import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../../common/types';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { BlockedUserService } from './blocked-user.service';

@ApiTags('Blocked User')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('users')
@UseGuards(AuthGuard)
export class BlockedUserController {
  constructor(private readonly blockedUserService: BlockedUserService) {}

  @ApiOperation({
    summary: 'Get current user blocked list',
    description: 'Returns list of users blocked by the authenticated user',
  })
  @ApiOkResponse({ description: 'Blocked users fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Get('me/blocked')
  async getMyBlockedUsers(@CurrentUser() user: AccessTokenPayload) {
    return this.blockedUserService.getMyBlockedUsers(user.id);
  }

  @ApiOperation({
    summary: 'Block user',
    description: 'Blocks a user by ID for the authenticated user',
  })
  @ApiCreatedResponse({ description: 'User blocked successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({
    name: 'blockedId',
    type: Number,
    description: 'The ID of the user which you want to block',
    required: true,
  })
  @Post('block/:blockedId')
  async blockUser(
    @Param('blockedId') blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.blockUser(user.id, blockedId);
  }

  @ApiOperation({
    summary: 'Unblock user',
    description: 'Removes user from blocked list',
  })
  @ApiOkResponse({ description: 'Blocked users fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({
    name: 'blockedId',
    type: Number,
    description: 'The ID of the user which you want to block',
    required: true,
  })
  @Delete('block/:blockedId')
  async unblockUser(
    @Param('blockedId') blockedId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.blockedUserService.unblockUser(user.id, blockedId);
  }
}
