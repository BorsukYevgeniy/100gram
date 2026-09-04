import { AccessTokenPayload } from '@app/contracts//auth';
import { CreateMessageDto } from '@app/contracts//message/dto';
import { Message } from '@app/contracts//message/types';
import { PaginationDto } from '@app/contracts//pagination';
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
import { MessageFilesInterceptor } from '../../../common/interceptor/message-files.interceptor';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guard/verified-auth.guard';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessageControllerDocs, ChatMessageRoutes } from './docs';

@ChatMessageControllerDocs()
@Controller('chats/:chatId/messages')
@UseGuards(VerifiedUserGuard)
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessagesService) {}

  @ChatMessageRoutes.GetMessageInChat()
  @Get()
  async getAllMessagesInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    //: Promise<PaginatedMessageFiles> {
    return this.chatMessageService.getAllMessagesInChat(
      user,
      chatId,
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
    return this.chatMessageService.create(
      user,
      chatId,
      createMessageDto,
      files,
    );
  }
}
