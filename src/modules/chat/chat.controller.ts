import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Controller('chats')
@UseGuards(VerifiedUserGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('private')
  async createPrivateChat(
    @User() user: AccessTokenPayload,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return await this.chatService.createPrivateChat(user.id, dto);
  }

  @Post('group')
  async createGroupChat(
    @User() user: AccessTokenPayload,
    @Body() dto: CreateGroupChatDto,
  ) {
    return await this.chatService.createGroupChat(user.id, dto);
  }

  @Get(':id')
  async findOne(
    @User() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.chatService.findById(user, id);
  }

  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ) {
    return await this.chatService.updateOwner(chatId, ownerId);
  }

  @Patch(':chatId')
  async updateGroupChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return await this.chatService.updateGroupChat(chatId, updateChatDto);
  }

  @Post(':chatId/users/:userId')
  async addUserToChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.chatService.addUserToChat(chatId, userId);
  }

  @Delete(':chatId/users/:userId')
  async deleteUserFromChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    const chat = await this.chatService.deleteUserFromChat(chatId, userId);
    await this.chatGateway.leaveChat(chatId, userId);

    return chat;
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.chatService.delete(id);
  }
}
