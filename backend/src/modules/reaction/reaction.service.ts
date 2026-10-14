import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { ChatValidationService } from '../chat/validation/chat-validation.service';
import { MessageRepository } from '../message/repository/message.repository';
import { MessageFiles } from '../message/types/message.types';
import { AddReactionDto } from './dto/add-reaction.dto';
import { UpdateReactionDto } from './dto/update-reaction.dto';
import { ReactionRepository } from './reaction.repository';

@Injectable()
export class ReactionService {
  constructor(
    private readonly reactionRepo: ReactionRepository,
    private readonly messageRepo: MessageRepository,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReactionService.name);
  }

  private async validateReactionPermission(
    userId: number,
    messageId: number,
  ): Promise<MessageFiles> {
    this.logger.debug({ userId, messageId }, 'Validating reaction permission');
    const msg = await this.messageRepo.findById(messageId);

    if (!msg) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    await this.chatValidator.validateChatParticipation(userId, msg.chatId);

    return msg;
  }

  async addReaction(userId: number, messageId: number, dto: AddReactionDto) {
    try {
      const { chatId } = await this.validateReactionPermission(
        userId,
        messageId,
      );
      await this.chatValidator.checkReactionAllowed(chatId, dto.reaction);

      const reaction = await this.reactionRepo.addReaction(
        userId,
        messageId,
        dto,
      );

      this.logger.info(
        { userId, messageId, reaction: dto.reaction },
        'Added reaction to message',
      );

      return reaction;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        this.logger.warn(
          { messageId, userId, reaction: dto.reaction },
          'Reaction already added',
        );
        throw new ConflictException('Reaction already added');
      }
      throw e;
    }
  }

  async updateReaction(
    userId: number,
    messageId: number,
    dto: UpdateReactionDto,
  ) {
    const { chatId } = await this.validateReactionPermission(userId, messageId);
    await this.chatValidator.checkReactionAllowed(chatId, dto.reaction);

    try {
      const reaction = await this.reactionRepo.updateReaction(
        userId,
        messageId,
        dto,
      );

      this.logger.info(
        { userId, messageId, reaction: dto.reaction },
        'Updated reaction of message',
      );

      return reaction;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ messageId }, 'Message not found');
        throw new NotFoundException('Message not found');
      }
      throw e;
    }
  }

  async removeReaction(userId: number, messageId: number) {
    await this.validateReactionPermission(userId, messageId);

    try {
      const reaction = await this.reactionRepo.removeReaction(
        userId,
        messageId,
      );

      this.logger.info({ userId, messageId }, 'Deleted reaction to message');
      return reaction;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ messageId }, 'Message not found');
        throw new NotFoundException('Message not found');
      }
      throw e;
    }
  }
}
