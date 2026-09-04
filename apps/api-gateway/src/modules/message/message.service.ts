import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AccessTokenPayload } from '@app/contracts/auth';
import { UpdateMessageDto } from '@app/contracts/message/dto';
import { MessagePatterns } from '@app/contracts/message/pattern';
import {
  MessageActionPayload,
  UpdateMessagepayload,
} from '@app/contracts/message/payload';
import { Message } from '@app/contracts/message/types';
import { CHAT_CLIENT } from '../../common/client/chat/chat-client.constants';

@Injectable()
export class MessageService {
  constructor(@Inject(CHAT_CLIENT) private readonly chatClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: MessagePatterns,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.chatClient.send<TOut, TIn>(pattern, input));
  }

  async getById(messageId: number, user: AccessTokenPayload) {
    return this.send<Message, MessageActionPayload>(MessagePatterns.FIND_ONE, {
      messageId,
      user,
    });
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    updateMessageDto: UpdateMessageDto,
    files: Express.Multer.File[],
  ) {
    return this.send<Message, UpdateMessagepayload>(MessagePatterns.UPDATE, {
      messageId,
      user,
      files,
      updateMessageDto,
    });
  }

  async delete(messageId: number, user: AccessTokenPayload) {
    return this.send<Message, MessageActionPayload>(MessagePatterns.DELETE, {
      messageId,
      user,
    });
  }
}
