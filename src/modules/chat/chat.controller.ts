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
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { ChatService } from './chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Controller('chats')
@UseGuards(VerifiedUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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
  async findOne(@User() user: AccessTokenPayload, @Param('id') id: number) {
    return await this.chatService.findById(user, id);
  }

  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId') chatId: number,
    @Param('ownerId') ownerId: number,
  ) {
    return await this.chatService.updateOwner(chatId, ownerId);
  }

  @Patch(':chatId')
  async updateGroupChat(
    @Param('chatId') chatId: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return await this.chatService.updateGroupChat(chatId, updateChatDto);
  }

  @Delete(':id')
  async delete(@User() user: AccessTokenPayload, @Param('id') id: number) {
    return await this.chatService.delete(user, id);
  }
}
