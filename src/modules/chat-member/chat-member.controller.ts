import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { PaginatedUserNoCredOtpVCode } from '../user/types/user.types';

import { UpdateRoleDto } from '../chat/dto/role/update-role.dto';
import { ChatMemberService } from './chat-member.service';
import { ChatMemberControllerDocs, ChatMemberRoutesDocs } from './docs';

@ChatMemberControllerDocs()
@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatMemberController {
  constructor(private readonly chatMemberService: ChatMemberService) {}

  @ChatMemberRoutesDocs.GetUsersInChat()
  @Get()
  async getUsersInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    return this.chatMemberService.getUsersInChat(user, chatId, paginationDto);
  }

  @ChatMemberRoutesDocs.AddUserToChat()
  @Post(':userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatMemberService.addUserToChat(chatId, userId);
  }

  @ChatMemberRoutesDocs.DeleteUserFromChat()
  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatMemberService.deleteUserFromChat(
      chatId,
      userId,
      currentUser,
    );
  }

  @ChatMemberRoutesDocs.UpdateUserRole()
  @Patch(':userId/role')
  async updateUserRole(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatMemberService.updateUserChatRole(
      currentUser,
      chatId,
      userId,
      dto,
    );
  }
}
