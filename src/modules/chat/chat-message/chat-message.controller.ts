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
import { Message } from '../../../../generated/prisma/client';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { MessageFilesInterceptor } from '../../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { CreateMessageDto } from '../../message/dto/create-message.dto';
import { PaginatedMessageFiles } from '../../message/types/message.types';
import { ChatMessageService } from './chat-message.service';
import { ChatMessageControllerDocs, ChatMessageRoutes } from './docs';

@ChatMessageControllerDocs()
@Controller('chats/:chatId/messages')
@UseGuards(VerifiedUserGuard)
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  @ChatMessageRoutes.GetMessageInChat()
  @Get()
  async getAllMessagesInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMessageFiles> {
    return this.chatMessageService.getAllMessagesInChat(
      chatId,
      user,
      paginationDto,
    );
  }

  @ChatMessageRoutes.CreateMessage()
  @Post()
  @UseInterceptors(MessageFilesInterceptor)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    return this.chatMessageService.createMessageInChat(
      chatId,
      user,
      createMessageDto,
      files,
    );
  }
}
