import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './message.repository';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  private async validateMessageOwnership(
    clientId: number,
    messageId: number,
  ): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) throw new NotFoundException('Message not found');

    if (message.userId !== clientId)
      throw new ForbiddenException(
        'You do not have permission to access this message',
      );

    return message;
  }

  async create(userId: number, dto: CreateMessageDto): Promise<Message> {
    return await this.messageRepository.create(userId, dto);
  }

  async findById(clientId: number, messageId: number): Promise<Message> {
    return await this.validateMessageOwnership(clientId, messageId);
  }

  async update(
    clientId: number,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    await this.validateMessageOwnership(clientId, messageId);
    return await this.messageRepository.update(messageId, dto);
  }

  async delete(clientId: number, messageId: number): Promise<Message> {
    await this.validateMessageOwnership(clientId, messageId);
    return await this.messageRepository.delete(messageId);
  }
}
