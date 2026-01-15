import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { PaginatedUserNoCredVCode } from '../../user/types/user.types';

import { ChatUserService } from './chat-user.service';

@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatUserController {
  constructor(private readonly chatUserService: ChatUserService) {}

  @Get()
  async getUsersInChat(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredVCode> {
    return this.chatUserService.getUsersInChat(user, chatId, paginationDto);
  }

  @Post(':userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.addUserToChat(chatId, userId);
  }

  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.deleteUserFromChat(chatId, userId);
  }
}
