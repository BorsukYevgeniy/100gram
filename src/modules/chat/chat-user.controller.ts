import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload } from '../../common/types';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Controller('chats/:chatId/users')
export class ChatUserController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('users')
  getUsersInChat(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.getUserIdsInChat(user, chatId);
  }

  @Post(':userId')
  addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatService.addUserToChat(chatId, userId);
  }

  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    const chat = await this.chatService.deleteUserFromChat(chatId, userId);
    this.chatGateway.leaveChat(chatId, userId);

    return chat;
  }
}
