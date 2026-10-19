import { Injectable } from '@nestjs/common';
import { ChatType } from '../../../../generated/prisma/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { CreateMessageDto } from '../../message/dto/create-message.dto';
import { MessageService } from '../../message/message.service';
import { PaginatedMessageFilesReactionCount } from '../../message/types/message.types';
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
    { userId }: AccessTokenPayload,
    paginationDto: PaginationDto,
  ): Promise<PaginatedMessageFilesReactionCount> {
    await this.chatValidation.validateChatParticipation(userId, chatId);

    return this.messageService.getMessagesInChat(chatId, paginationDto, userId);
  }

  async createMessageInChat(
    chatId: number,
    user: AccessTokenPayload,
    dto: CreateMessageDto,
    files: Express.Multer.File[],
  ) {
    await this.chatValidation.validateChatParticipation(user.userId, chatId);

    const { chatType } = await this.chatRepo.findChatType(chatId);

    if (chatType === ChatType.CHANNEL)
      await this.chatValidation.validateOwner(user, chatId);

    return this.messageService.create(user.userId, chatId, dto, files);
  }

  async deleteAllMessages(chatId: number, user: AccessTokenPayload) {
    const { chatType } = await this.chatRepo.findChatType(chatId);

    if (chatType === ChatType.PRIVATE) {
      await this.chatValidation.validateChatParticipation(user.userId, chatId);
    } else await this.chatValidation.validateOwner(user, chatId);

    return this.messageService.deleteAllMessagesInChat(chatId);
  }
}
