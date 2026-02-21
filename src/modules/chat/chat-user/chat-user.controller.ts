import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { PaginatedUserNoCredOtpVCode } from '../../user/types/user.types';

import { ChatUserService } from './chat-user.service';

@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatUserController {
  constructor(private readonly chatUserService: ChatUserService) {}

  @Get()
  async getUsersInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
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
