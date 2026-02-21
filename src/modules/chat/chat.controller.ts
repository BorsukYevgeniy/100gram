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

  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ) {
    return this.chatService.findById(user, id);
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
