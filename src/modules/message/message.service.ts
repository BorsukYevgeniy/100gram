import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message, Role } from '../../../generated/prisma/client';
import { JwtPayload } from '../../common/interfaces';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './message.repository';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  private async validateMessageOwnership(
    user: JwtPayload,
    messageId: number,
  ): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) throw new NotFoundException('Message not found');

    if (message.userId !== user.id && user.role !== Role.ADMIN)
      throw new ForbiddenException(
        'You do not have permission to access this message',
      );

    return message;
  }

  async create(
    userId: number,
    chatId: number,
    dto: CreateMessageDto,
  ): Promise<Message> {
    return await this.messageRepository.create(userId, chatId, dto);
  }

  async findById(user: JwtPayload, messageId: number): Promise<Message> {
    const message = await this.validateMessageOwnership(user, messageId);

    if (!message) throw new NotFoundException('Message not found');

    return message;
  }

  async findAllMessageInChat(chatId: number): Promise<Message[]> {
    const messages = await this.messageRepository.findAllMessageInChat(chatId);

    if (!messages)
      throw new NotFoundException('No messages found in this chat');

    return messages;
  }

  async update(
    user: JwtPayload,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    return await this.messageRepository.update(messageId, dto);
  }

  async delete(user: JwtPayload, messageId: number): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    return await this.messageRepository.delete(messageId);
  }
}
