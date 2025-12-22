import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { Role } from '../../common/enum/role.enum';
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

  async create(userId: number, dto: CreateMessageDto): Promise<Message> {
    return await this.messageRepository.create(userId, dto);
  }

  async findById(user: JwtPayload, messageId: number): Promise<Message> {
    return await this.validateMessageOwnership(user, messageId);
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
