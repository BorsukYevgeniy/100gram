import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Message, Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/interfaces';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageRepository } from './message.repository';

@Injectable()
export class MessageService {
  constructor(private readonly messageRepository: MessageRepository) {}

  private async validateMessageOwnership(
    user: AccessTokenPayload,
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
    try {
      return await this.messageRepository.create(userId, chatId, dto);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new NotFoundException('Chat not found');
      } else throw e;
    }
  }

  async findById(
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<Message> {
    return await this.validateMessageOwnership(user, messageId);
  }

  async update(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    return await this.messageRepository.update(messageId, dto);
  }

  async delete(user: AccessTokenPayload, messageId: number): Promise<Message> {
    await this.validateMessageOwnership(user, messageId);
    return await this.messageRepository.delete(messageId);
  }
}
