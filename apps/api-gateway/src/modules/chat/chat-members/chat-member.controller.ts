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
import { AccessTokenPayload } from '@app/contracts/auth';
import { UpdateRoleDto } from '@app/contracts/chat/dto';
import { PaginationDto } from '@app/contracts/pagination';
import { PaginatedUserNoCredOtpVCode } from '@app/contracts/user/types';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guard/verified-auth.guard';
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

