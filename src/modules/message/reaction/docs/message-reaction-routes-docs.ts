import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

export class MessageReactionRoutesDocs {
  static AddReaction() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add reaction to message',
        description:
          'Adds a new reaction from the authenticated user to the specified message',
      }),
      ApiCreatedResponse({ description: 'Reaction added successfully' }),
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
    );
  }
}
