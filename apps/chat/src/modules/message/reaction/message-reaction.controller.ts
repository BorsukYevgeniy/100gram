import { UpdateReactionDto } from '@app/contracts/reaction/dto';
import { AddReactionDto } from '@app/contracts/reaction/dto/add-reaction.dto';
import { ReactionPattern } from '@app/contracts/reaction/pattern';
import { ReactionActionPayload } from '@app/contracts/reaction/payload';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReactionService } from '../../reaction/reaction.service';

@Controller()
export class MessageReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @MessagePattern(ReactionPattern.ADD_REACTION)
  async addReaction(
    @Payload()
    { dto, messageId, userId }: ReactionActionPayload<AddReactionDto>,
  ) {
    return this.reactionService.addReaction(userId, messageId, dto);
  }

  @MessagePattern(ReactionPattern.UPDATE_REACTION)
  async updateReaction(
    @Payload()
    { dto, messageId, userId }: ReactionActionPayload<UpdateReactionDto>,
  ) {
    return this.reactionService.updateReaction(userId, messageId, dto);
  }

  @MessagePattern(ReactionPattern.DELETE_REACTION)
  async removeReaction(
    @Payload() { messageId, userId }: ReactionActionPayload<null>,
  ) {
    return this.reactionService.removeReaction(userId, messageId);
  }
}
