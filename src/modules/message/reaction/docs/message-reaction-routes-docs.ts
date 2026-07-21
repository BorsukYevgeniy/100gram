import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiMessageNotFound } from '../../docs/shared';

function ApiInvalidReactionDataResponse() {
  return ApiBadRequestResponse({ description: 'Invalid reaction data' });
}

function ApiMessageOrReactionNotFoundResponse() {
  return ApiNotFoundResponse({
    description: 'Message or reaction not found',
  });
}

export class MessageReactionRoutesDocs {
  static AddReaction() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add reaction to message',
        description:
          'Adds a new reaction from the authenticated user to the specified message',
      }),
      ApiCreatedResponse({ description: 'Reaction added successfully' }),
      ApiInvalidReactionDataResponse(),
      ApiMessageNotFound(),
    );
  }

  static UpdateReaction() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update reaction',
        description:
          'Updates the authenticated user reaction for the specified message',
      }),
      ApiOkResponse({ description: 'Reaction updated successfully' }),
      ApiInvalidReactionDataResponse(),
      ApiMessageOrReactionNotFoundResponse(),
    );
  }

  static DeleteReaction() {
    return applyDecorators(
      ApiOperation({
        summary: 'Remove reaction',
        description:
          'Removes the authenticated user reaction from the specified message',
      }),
      ApiOkResponse({ description: 'Reaction removed successfully' }),
      ApiMessageNotFound(),
    );
  }
}
