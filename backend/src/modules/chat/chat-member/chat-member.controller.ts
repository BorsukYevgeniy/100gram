import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { ChatMemberService } from './chat-member.service';
import { ChatMemberControllerDocs, ChatMemberRoutesDocs } from './docs';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginatedChatMembers } from './types/chat-member.types';

@ChatMemberControllerDocs()
@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatMemberController {
  constructor(private readonly chatMemberService: ChatMemberService) {}

  @ChatMemberRoutesDocs.GetUsersInChat()
  @Get()
  async getUsersInChat(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedChatMembers> {
    return this.chatMemberService.getUsersInChat(id, chatId, paginationDto);
  }

  @ChatMemberRoutesDocs.JoinToChat()
  @Post('me')
  async join(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.chatMemberService.joinToChat(chatId, userId);
  }

  @ChatMemberRoutesDocs.AddUserToChat()
  @Post(':userId')
  async addUserToChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatMemberService.addUserToChat(currentUser, chatId, userId);
  }

  @ChatMemberRoutesDocs.LeaveChat()
  @Delete('me')
  async leaveChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.chatMemberService.leaveChat(chatId, userId);
  }

  @ChatMemberRoutesDocs.DeleteUserFromChat()
  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
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
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
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
