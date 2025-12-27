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
import { AccessTokenPayload } from '../../common/interfaces';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ChatService } from './chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Controller('chats')
@UseGuards(AuthGuard)
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
  async findOne(
    @User() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.chatService.findById(user, id);
  }

  @Patch(':id')
  async updateGroupChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return await this.chatService.updateGroupChat(id, updateChatDto);
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
    return await this.chatService.deleteUserFromChat(chatId, userId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.chatService.delete(id);
  }
}
