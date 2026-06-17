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
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { PaginatedUserNoCredOtpVCode } from '../../user/types/user.types';

import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { ChatUserService } from './chat-user.service';
import { ChatUserControllerDocs, ChatUserRoutesDocs } from './docs';

@ChatUserControllerDocs()
@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatUserController {
  constructor(private readonly chatUserService: ChatUserService) {}

  @ChatUserRoutesDocs.GetUsersInChat()
  @Get()
  async getUsersInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    return this.chatUserService.getUsersInChat(user, chatId, paginationDto);
  }

  @ChatUserRoutesDocs.AddUserToChat()
  @Post(':userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.addUserToChat(chatId, userId);
  }

  @ChatUserRoutesDocs.DeleteUserFromChat()
  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.deleteUserFromChat(chatId, userId);
  }

  @ChatUserRoutesDocs.UpdateUserRole()
  @Patch(':userId/role')
  async updateUserRole(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatUserService.updateUserChatRole(
      currentUser,
      chatId,
      userId,
      dto,
    );
  }
}
