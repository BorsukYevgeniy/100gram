import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiFileUploadDocs } from '../../../../common/decorators/docs/file';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';
import { CreateMessageDto } from '../../../message/dto/create-message.dto';

export class ChatMessageRoutes {
  static GetMessageInChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all message in chat',
        description: 'Returns all messages in chat with pagination',
      }),
      ApiOkResponse({ description: 'Fetched messages in chat' }),
      ApiForbiddenResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiPaginationDocs(),
    );
  }

  static CreateMessage() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create message in chat',
        description:
          'Creates a message in a chat. The user must be a participant; only the channel owner or an admin can create messages in a channel.',
      }),
      ApiCreatedResponse({ description: 'Message created successfully' }),
      ApiForbiddenResponse({
        description:
          'User is not a participant of the chat or is not allowed to create messages in the channel',
      }),
      ApiConsumes('multipart/form-data'),
      ApiFileUploadDocs('Optional attachments: up to 5 files, 200 MB per file'),
      ApiBody({
        type: CreateMessageDto,
        description: 'The message content and optional attachments',
      }),
    );
  }
}
