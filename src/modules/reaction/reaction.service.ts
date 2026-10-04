import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { AccessTokenPayload } from '../../common/types';
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
    user: AccessTokenPayload,
    messageId: number,
  ): Promise<MessageFiles> {
    this.logger.debug(
      { userId: user.id, messageId },
      'Validating reaction permission',
    );
    const msg = await this.messageRepo.findById(messageId);

    if (!msg) {
      this.logger.warn({ messageId }, 'Message not found');
      throw new NotFoundException('Message not found');
    }

    await this.chatValidator.validateChatParticipation(user, msg.chatId);

    return msg;
  }

  async addReaction(
    user: AccessTokenPayload,
    messageId: number,
    dto: AddReactionDto,
  ) {
    try {
      const { chatId } = await this.validateReactionPermission(user, messageId);
      await this.chatValidator.checkReactionAllowed(chatId, dto.reaction);

      const reaction = await this.reactionRepo.addReaction(
        user.id,
        messageId,
        dto,
      );

      this.logger.info(
        { userId: user.id, messageId, reaction: dto.reaction },
        'Added reaction to message',
      );

      return reaction;
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async updateReaction(
    user: AccessTokenPayload,
    messageId: number,
    dto: UpdateReactionDto,
  ) {
    const { chatId } = await this.validateReactionPermission(user, messageId);
    await this.chatValidator.checkReactionAllowed(chatId, dto.reaction);

    try {
      const reaction = await this.reactionRepo.updateReaction(
        user.id,
        messageId,
        dto,
      );

      this.logger.info(
        { userId: user.id, messageId, reaction: dto.reaction },
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

  async removeReaction(user: AccessTokenPayload, messageId: number) {
    await this.validateReactionPermission(user, messageId);

    try {
      const reaction = await this.reactionRepo.removeReaction(
        user.id,
        messageId,
      );

      this.logger.info(
        { userId: user.id, messageId },
        'Deleted reaction to message',
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
}
