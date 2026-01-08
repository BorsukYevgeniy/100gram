import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { MessageService } from '../message/message.service';
import { PaginatedMessages } from '../message/types/paginated-messages.types';
import { ChatService } from './chat.service';

@Controller('chats/:chatId/messages')
@UseGuards(VerifiedUserGuard)
export class ChatMessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
  ) {}

  @Get()
  async getAllMessagesInChat(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMessages> {
    await this.chatService.validateChatParticipation(user, chatId);

    return this.messageService.getMessagesInChat(chatId, paginationDto);
  }

  @Post()
  create(
    @User() user: AccessTokenPayload,
    @Body() createMessageDto: CreateMessageDto,
    @Param('chatId') chatId: number,
  ): Promise<Message> {
    return this.messageService.create(user.id, chatId, createMessageDto);
  }
}
