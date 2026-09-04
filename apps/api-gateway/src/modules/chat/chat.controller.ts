import {
  CreateChannelDto,
  CreateGroupChatDto,
  CreatePrivateChatDto,
} from '@app/contracts/chat/dto';
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
import { UpdateGroupChatDto } from '@app/contracts/chat/dto/update-group-chat.dto';
import { PaginationDto } from '@app/contracts/pagination';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../auth/guard/verified-auth.guard';
import { ChatService } from './chat.service';
import { ChatControllerDocs, ChatRoutesDocs } from './docs';

@ChatControllerDocs()
@Controller('chats')
@UseGuards(VerifiedUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ChatRoutesDocs.GetMyChats()
  @Get('me')
  async getMyChats(
    @CurrentUser() user: AccessTokenPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.chatService.getMyChats(user.id, paginationDto);
  }

  @ChatRoutesDocs.CreatePrivateChat()
  @Post('private')
  async createPrivateChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return this.chatService.createPrivateChat(user.id, dto);
  }

  @ChatRoutesDocs.CreateGroupChat()
  @Post('group')
  async createGroupChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatService.createGroupChat(user.id, dto);
  }

  @ChatRoutesDocs.CreateChannel()
  @Post('channel')
  async createChannel(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateChannelDto,
  ) {
    return this.chatService.createChannel(user.id, dto);
  }

  @ChatRoutesDocs.AddChatByInviteToken()
  @Post('invite/:inviteToken')
  async addChatByInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('inviteToken') inviteToken: string,
  ) {
    return this.chatService.addUserByInviteToken(user, inviteToken);
  }

  @ChatRoutesDocs.UpdateInviteToken()
  @Patch(':chatId/invite-token')
  async updateInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.updateInviteToken(chatId, user);
  }

  @ChatRoutesDocs.GetChatById()
  @Get(':chatId')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.findById(chatId, user);
  }

  @ChatRoutesDocs.UpdateOwner()
  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId') chatId: number,
    @Param('ownerId') ownerId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.chatService.updateOwner(chatId, ownerId, user);
  }

  @ChatRoutesDocs.UpdateGroupChat()
  @Patch(':chatId')
  async updateGroupChat(
    @Param('chatId') chatId: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return this.chatService.updateGroupChat(chatId, updateChatDto);
  }

  @ChatRoutesDocs.DeleteChat()
  @Delete(':chatId')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.delete(chatId, user);
  }
}
