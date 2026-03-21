import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { ChatService } from './chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateRoleDto } from './dto/role/update-role.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Controller('chats')
@UseGuards(VerifiedUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('private')
  async createPrivateChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return this.chatService.createPrivateChat(user.id, dto);
  }

  @Post('group')
  async createGroupChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatService.createGroupChat(user.id, dto);
  }

  @Post('invite/:inviteToken')
  async addChatByInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('inviteToken') inviteToken: string,
  ) {
    return this.chatService.addUserByInviteToken(user, inviteToken);
  }

  @Patch(':chatId/invite-token')
  async updateInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.updateInviteToken(user, chatId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ) {
    return this.chatService.findById(user, id);
  }

  @Patch(':chatId/users/:userId/role')
  async updateUserRole(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatService.updateUserChatRole(
      currentUser,
      chatId,
      userId,
      dto,
    );
  }

  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId') chatId: number,
    @Param('ownerId') ownerId: number,
  ) {
    return this.chatService.updateOwner(chatId, ownerId);
  }

  @Patch(':chatId')
  async updateGroupChat(
    @Param('chatId') chatId: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return this.chatService.updateGroupChat(chatId, updateChatDto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ) {
    return this.chatService.delete(user, id);
  }
}
