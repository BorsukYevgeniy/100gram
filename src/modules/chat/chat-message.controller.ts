import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { MessageService } from '../message/message.service';
import { ChatService } from './chat.service';

@Controller('chats/:chatId/messages')
@UseGuards(AuthGuard)
export class ChatMessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatService: ChatService,
  ) {}

  @Get()
  async getAllMessagesInChat(
    @User() user: JwtPayload,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return await this.chatService.getAllMessagesInChat(user, chatId);
  }

  @Post()
  async create(
    @User() user: JwtPayload,
    @Body() createMessageDto: CreateMessageDto,
    @Param('chatId', ParseIntPipe) chatId: number,
  ): Promise<Message> {
    return await this.messageService.create(user.id, chatId, createMessageDto);
  }
}
