import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { AddReactionDto } from '../../reaction/dto/add-reaction.dto';
import { UpdateReactionDto } from '../../reaction/dto/update-reaction.dto';
import { ReactionService } from '../../reaction/reaction.service';
import {
  MessageReactionControllerDocs,
  MessageReactionRoutesDocs,
} from './docs';

@MessageReactionControllerDocs()
@Controller('messages/:messageId/reactions')
@UseGuards(VerifiedUserGuard)
export class MessageReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @MessageReactionRoutesDocs.AddReaction()
  @Post()
  async addReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
    @Body() dto: AddReactionDto,
  ) {
    return this.reactionService.addReaction(user.id, messageId, dto);
  }

  @MessageReactionRoutesDocs.UpdateReaction()
  @Patch()
  async updateReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
    @Body() dto: UpdateReactionDto,
  ) {
    return this.reactionService.updateReaction(user.id, messageId, dto);
  }

  @MessageReactionRoutesDocs.DeleteReaction()
  @Delete()
  async removeReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
  ) {
    return this.reactionService.removeReaction(user.id, messageId);
  }
}
