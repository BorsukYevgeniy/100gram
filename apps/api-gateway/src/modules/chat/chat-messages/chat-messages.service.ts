import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AccessTokenPayload } from '@app/contracts/auth';
import { ChatMessagePattern } from '@app/contracts/chat-message/pattern';
import { ChatMessageAction } from '@app/contracts/chat-message/payload/chat-message-action.payload';
import { CreateMessageDto } from '@app/contracts/message/dto';
import { Message } from '@app/contracts/message/types';
import { PaginationDto } from '@app/contracts/pagination';
import { CHAT_CLIENT } from '../../../common/client/chat/chat-client.constants';

@Injectable()
export class ChatMessagesService {
  constructor(@Inject(CHAT_CLIENT) private readonly chatClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: ChatMessagePattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.chatClient.send<TOut, TIn>(pattern, input));
  }

  async getAllMessagesInChat(
    user: AccessTokenPayload,
    chatId: number,
    dto: PaginationDto,
  ) {
    //: Promise<PaginatedMessageFiles> {
    return this.send<any, ChatMessageAction<PaginationDto>>(
      ChatMessagePattern.GET_ALL_MESSAGE_IN_CHAT,
      { user, chatId, dto },
    );
  }

  async create(
    user: AccessTokenPayload,
    chatId: number,
    createMessageDto: CreateMessageDto,
    files: Express.Multer.File[],
  ): Promise<Message> {
    return this.send<
      Message,
      ChatMessageAction<CreateMessageDto> & { files: Express.Multer.File[] }
    >(ChatMessagePattern.CREATE_MESSAGE_IN_CHAT, {
      user,
      chatId,
      dto: createMessageDto,
      files,
    });
  }
}

