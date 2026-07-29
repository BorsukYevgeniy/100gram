import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';

export class ChatMessageRoutes {
  static GetMessageInChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all message in chat',
        description: 'Returns all messages in chat with pagination',
      }),
      ApiOkResponse({ description: 'Fetched messages in chat' }),
      ApiPaginationDocs(),
    );
  }

  static CreateMessage() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create message in chat',
        description: 'Create new message in chat or channel',
      }),
      ApiCreatedResponse({ description: 'Message created successfully' }),
    );
  }
}
