import { AccessTokenPayload } from '@app/contracts/auth';
import { AddReactionDto, UpdateReactionDto } from '@app/contracts/reaction/dto';
import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guard/verified-auth.guard';
import {
  MessageReactionControllerDocs,
  MessageReactionRoutesDocs,
} from './docs';
import { MessageReactionService } from './message-reaction.service';

@MessageReactionControllerDocs()
@Controller('messages/:messageId/reactions')
@UseGuards(VerifiedUserGuard)
export class MessageReactionController {
  constructor(private readonly reactionService: MessageReactionService) {}

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
