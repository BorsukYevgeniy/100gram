import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatMessagePattern } from '@app/contracts/chat-message/pattern';
import { ChatMessageAction } from '@app/contracts/chat-message/payload/chat-message-action.payload';
import { CreateMessageDto } from '@app/contracts/message/dto';
import { Message } from '@app/contracts/message/types';
import { PaginationDto } from '@app/contracts/pagination';
import { ChatMessageService } from './chat-message.service';

@Controller('chats/:chatId/messages')
export class ChatMessageController {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  @MessagePattern(ChatMessagePattern.GET_ALL_MESSAGE_IN_CHAT)
  async getAllMessagesInChat(
    @Payload() { chatId, dto, user }: ChatMessageAction<PaginationDto>,
    // ): Promise<PaginatedMessageFiles> {
  ) {
    return this.chatMessageService.getAllMessagesInChat(chatId, user, dto);
  }

  @MessagePattern(ChatMessagePattern.CREATE_MESSAGE_IN_CHAT)
  async create(
    @Payload()
    {
      chatId,
      dto,
      user,
      files,
    }: ChatMessageAction<CreateMessageDto> & { files: Express.Multer.File[] },
  ): Promise<Message> {
    return this.chatMessageService.createMessageInChat(
      chatId,
      user,
      dto,
      files,
    );
  }
}

