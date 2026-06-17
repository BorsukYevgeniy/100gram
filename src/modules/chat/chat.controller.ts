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
import { ChatService } from './chat.service';
import { ChatControllerDocs, ChatRoutesDocs } from './docs';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

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
    return this.chatService.updateInviteToken(user, chatId);
  }

  @ChatRoutesDocs.GetChatById()
  @Get(':chatId')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') id: number,
  ) {
    return this.chatService.findById(user, id);
  }

  @ChatRoutesDocs.UpdateOwner()
  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId') chatId: number,
    @Param('ownerId') ownerId: number,
  ) {
    return this.chatService.updateOwner(chatId, ownerId);
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
  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ) {
    return this.chatService.delete(user, id);
  }
}
