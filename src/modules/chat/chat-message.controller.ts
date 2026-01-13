import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { FilesInterceptor } from '../../common/interceptor/files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { CreateMessageDto } from '../message/dto/create-message.dto';
import { MessageService } from '../message/message.service';
import { PaginatedMessageFiles } from '../message/types/message.types';
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
  ): Promise<PaginatedMessageFiles> {
    await this.chatService.validateChatParticipation(user, chatId);

    return await this.messageService.getMessagesInChat(chatId, paginationDto);
  }

  @Post()
  @UseInterceptors(FilesInterceptor)
  async create(
    @User() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    return await this.messageService.create(
      user.id,
      chatId,
      createMessageDto,
      files,
    );
  }
}
