import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { AddReactionDto } from '../../reaction/dto/add-reaction.dto';
import { UpdateReactionDto } from '../../reaction/dto/update-reaction.dto';
import { ReactionService } from '../../reaction/reaction.service';

@ApiTags('Message Reaction')
@ApiParam({
  name: 'messageId',
  type: Number,
  required: true,
  description: 'ID of message',
})
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({
  description: 'You must be authorized to access this resource',
})
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@Controller('messages/:messageId/reactions')
@UseGuards(VerifiedUserGuard)
export class MessageReactionController {
  constructor(private readonly reactionService: ReactionService) {}

  @ApiOperation({
    summary: 'Add reaction to message',
    description:
      'Adds a new reaction from the authenticated user to the specified message',
  })
  @ApiCreatedResponse({ description: 'Reaction added successfully' })
  @ApiBadRequestResponse({ description: 'Invalid reaction data' })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiForbiddenResponse({
    description: 'User is not allowed to react to this message',
  })
  @Post()
  async addReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
    @Body() dto: AddReactionDto,
  ) {
    return this.reactionService.addReaction(user.id, messageId, dto);
  }

  @ApiOperation({
    summary: 'Update reaction',
    description:
      'Updates the authenticated user reaction for the specified message',
  })
  @ApiOkResponse({ description: 'Reaction updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid reaction data' })
  @ApiNotFoundResponse({
    description: 'Message or reaction not found',
  })
  @ApiForbiddenResponse({
    description: 'User is not allowed to update this reaction',
  })
  @Patch()
  async updateReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
    @Body() dto: UpdateReactionDto,
  ) {
    return this.reactionService.updateReaction(user.id, messageId, dto);
  }

  @ApiOperation({
    summary: 'Remove reaction',
    description:
      'Removes the authenticated user reaction from the specified message',
  })
  @ApiOkResponse({ description: 'Reaction removed successfully' })
  @ApiNotFoundResponse({
    description: 'Message or reaction not found',
  })
  @ApiForbiddenResponse({
    description: 'User is not allowed to remove this reaction',
  })
  @Delete()
  async removeReaction(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId') messageId: number,
  ) {
    return this.reactionService.removeReaction(user.id, messageId);
  }
}
