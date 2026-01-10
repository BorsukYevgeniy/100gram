import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { PaginatedUserNoCredVCode } from '../user/types/user.types';
import { ChatService } from './chat.service';

@UseGuards(VerifiedUserGuard)
@Controller('chats/:chatId/users')
export class ChatUserController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getUsersInChat(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredVCode> {
    return await this.chatService.getUsersInChat(user, chatId, paginationDto);
  }

  @Post(':userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return await this.chatService.addUserToChat(chatId, userId);
  }

  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return await this.chatService.deleteUserFromChat(chatId, userId);
  }
}
