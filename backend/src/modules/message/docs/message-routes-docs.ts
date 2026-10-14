import { applyDecorators } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiFileUploadDocs } from '../../../common/decorators/docs/file';

function ApiYouMustBeChatParticipantResponse() {
  return ApiForbiddenResponse({
    description: 'User is not a participant of the chat',
  });
}
export class MessageRoutesDocs {
  static GetById() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get message by ID',
        description: 'Returns a message by its ID',
      }),
      ApiOkResponse({
        description: 'Message fetched successfully',
      }),
      ApiYouMustBeChatParticipantResponse(),
    );
  }

  static Update() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update message',
        description: 'Updates message content and attachments',
      }),
      ApiOkResponse({
        description: 'Message updated successfully',
      }),
      ApiFileUploadDocs('File for message'),
      ApiForbiddenResponse({
        description: 'You must be an owner of the message',
      }),
    );
  }

  static Delete() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete message',
        description: 'Deletes a message by ID',
      }),
      ApiOkResponse({
        description: 'Message deleted successfully',
      }),
      ApiForbiddenResponse({
        description: 'You do not have permission to delete this message',
      }),
    );
  }

  static Pin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Pin message',
        description: 'Pins a message in the chat',
      }),
      ApiOkResponse({
        description: 'Message pinned successfully',
      }),
      ApiYouMustBeChatParticipantResponse(),
    );
  }

  static Unpin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unpin message',
        description: 'Unpins a message in the chat',
      }),
      ApiOkResponse({
        description: 'Message unpinned successfully',
      }),
      ApiYouMustBeChatParticipantResponse(),
    );
  }
}
