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

  @Get(':chatId/users')
  async getUsersInChat(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return await this.chatService.getUserIdsInChat(user, chatId);
  }

  @Post(':chatId/users/:userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return await this.chatService.addUserToChat(chatId, userId);
  }

  @Delete(':chatId/users/:userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return await this.chatService.deleteUserFromChat(chatId, userId);
  }
}
