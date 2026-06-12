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
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ChatType, Message } from '../../../../generated/prisma/client';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { MessageFilesInterceptor } from '../../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { CreateMessageDto } from '../../message/dto/create-message.dto';
import { MessageService } from '../../message/message.service';
import { PaginatedMessageFiles } from '../../message/types/message.types';
import { ChatValidationService } from '../validation/chat-validation.service';

@ApiTags('Chat Message')
@ApiParam({
  name: 'chatId',
  type: Number,
  required: true,
  description: 'ID of chat',
})
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@Controller('chats/:chatId/messages')
@UseGuards(VerifiedUserGuard)
export class ChatMessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatValidation: ChatValidationService,
  ) {}

  @ApiOperation({
    summary: 'Get all message in chat',
    description: 'Returns all messages in chat with pagination',
  })
  @ApiOkResponse({ description: 'Fetched messages in chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiQuery({
    description: 'Pagination data',
    type: PaginationDto,
    required: false,
  })
  @Get()
  async getAllMessagesInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMessageFiles> {
    await this.chatValidation.validateChatParticipation(user, chatId);

    return this.messageService.getMessagesInChat(chatId, paginationDto);
  }

  @ApiOperation({
    summary: 'Create message in chat',
    description: 'Create new message in chat or channel',
  })
  @ApiCreatedResponse({ description: 'Message created successfully' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'You must be a participant of chat or owner of the channel',
  })
  @ApiQuery({
    description: 'Pagination data',
    type: PaginationDto,
    required: false,
  })
  @Post()
  @UseInterceptors(MessageFilesInterceptor)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Body() createMessageDto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    const { chatType } = await this.chatValidation.validateChatParticipation(
      user,
      chatId,
    );

    if (chatType === ChatType.CHANNEL)
      await this.chatValidation.validateOwner(user, chatId);

    return this.messageService.create(user.id, chatId, createMessageDto, files);
  }
}
