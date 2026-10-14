import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../../common/types';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
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
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: AddReactionDto,
  ) {
    return this.reactionService.addReaction(id, messageId, dto);
  }

  @MessageReactionRoutesDocs.UpdateReaction()
  @Patch()
  async updateReaction(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: UpdateReactionDto,
  ) {
    return this.reactionService.updateReaction(id, messageId, dto);
  }

  @MessageReactionRoutesDocs.DeleteReaction()
  @Delete()
  async removeReaction(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.reactionService.removeReaction(id, messageId);
  }
}
