import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagePatterns } from '@app/contracts/message/pattern';
import {
  MessageActionPayload,
  UpdateMessagepayload,
} from '@app/contracts/message/payload';
import { Message } from '../../../generated/prisma/client';
import { MessageService } from './message.service';

@Controller()
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessagePattern(MessagePatterns.FIND_ONE)
  async findOne(
    @Payload() { messageId, user }: MessageActionPayload,
  ): Promise<Message> {
    return this.messageService.findById(user, messageId);
  }

  @MessagePattern(MessagePatterns.UPDATE)
  async update(
    @Payload()
    { files, messageId, user, updateMessageDto }: UpdateMessagepayload,
  ): Promise<Message> {
    return this.messageService.update(user, messageId, updateMessageDto, files);
  }

  @MessagePattern(MessagePatterns.DELETE)
  async delete(
    @Payload() { messageId, user }: MessageActionPayload,
  ): Promise<Message> {
    return this.messageService.delete(user, messageId);
  }
}
