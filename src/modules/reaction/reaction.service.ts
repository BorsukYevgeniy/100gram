import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatValidationService } from '../chat/validation/chat-validation.service';
import { MessageRepository } from '../message/repository/message.repository';
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
  ): Promise<void> {
    this.logger.debug({ userId, messageId }, 'Validating reaction permission');
    const msg = await this.messageRepo.findById(messageId);

    if (!msg) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    const isParticipant = await this.chatValidator.checkChatParticipation(
      userId,
      msg.chatId,
    );

    if (!isParticipant) {
      this.logger.warn({ userId }, 'User is not participant of the chat');
      throw new ForbiddenException('User is not participant of the chat');
    }
  }

  async addReaction(userId: number, messageId: number, dto: AddReactionDto) {
    await this.validateReactionPermission(userId, messageId);

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
  }

  async updateReaction(
    userId: number,
    messageId: number,
    dto: UpdateReactionDto,
  ) {
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
  }

  async removeReaction(userId: number, messageId: number) {
    const reaction = await this.reactionRepo.removeReaction(userId, messageId);

    this.logger.info({ userId, messageId }, 'Deleted reaction to message');
    return reaction;
  }
}
