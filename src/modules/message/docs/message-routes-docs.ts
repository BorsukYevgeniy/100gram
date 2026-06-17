import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiFileUploadDocs } from '../../../common/decorators/docs/file';

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
    );
  }
}
