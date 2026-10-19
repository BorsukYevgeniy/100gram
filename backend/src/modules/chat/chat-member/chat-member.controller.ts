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
import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { ChatMemberService } from './chat-member.service';
import { ChatMemberControllerDocs, ChatMemberRoutesDocs } from './docs';
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

  @ChatMemberRoutesDocs.AddUserToChat()
  @Post(':userId')
  async addUserToChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatMemberService.addUserToChat(currentUser, chatId, userId);
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
