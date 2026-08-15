import { Injectable } from '@nestjs/common';
import { ChatType } from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { CreateMessageDto } from '../../message/dto/create-message.dto';
import { MessageService } from '../../message/message.service';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

@Injectable()
export class ChatMessageService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly messageService: MessageService,
    private readonly chatValidation: ChatValidationService,
  ) {}

  async getAllMessagesInChat(
    chatId: number,
    user: AccessTokenPayload,
    paginationDto: PaginationDto,
  ) {
    await this.chatValidation.validateChatParticipation(user, chatId);

    return this.messageService.getMessagesInChat(chatId, paginationDto);
  }

  async createMessageInChat(
    chatId: number,
    user: AccessTokenPayload,
    dto: CreateMessageDto,
    files: Express.Multer.File[],
  ) {
    await this.chatValidation.validateChatParticipation(user, chatId);

    const { chatType } = await this.chatRepo.findChatType(chatId);

    if (chatType === ChatType.CHANNEL)
      await this.chatValidation.validateOwner(user, chatId);

    return this.messageService.create(user.id, chatId, dto, files);
  }
}
