import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';
import { ApiUserIdParamDocs } from '../../../user/docs/shared';
import { ApiChatNotFoundResponse } from '../../docs/shared';
import { UpdateRoleDto } from '../../dto/role/update-role.dto';

function ApiChatOrUserNotFound() {
  return ApiNotFoundResponse({ description: 'Chat or user not found' });
}

export class ChatUserRoutesDocs {
  static GetUsersInChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Fetch all users in chat',
        description: 'Return all users in someone chat with pagination',
      }),
      ApiOkResponse({ description: 'Fetched users in chat' }),
      ApiChatNotFoundResponse(),
      ApiPaginationDocs(),
    );
  }

  static AddUserToChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add users to chat',
        description: 'Add a new user in someone chat',
      }),
      ApiOkResponse({ description: 'User added' }),
      ApiChatOrUserNotFound(),
      ApiBadRequestResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiUserIdParamDocs(),
    );
  }

  static DeleteUserFromChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete users to chat',
        description: 'Delete a user from someone chat',
      }),
      ApiOkResponse({ description: 'User deleted' }),
      ApiChatOrUserNotFound(),
      ApiBadRequestResponse({
        description: 'User already isnt a participant of the chat',
      }),
      ApiUserIdParamDocs(),
    );
  }

  static UpdateUserRole() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update role of user in chat',
        description: 'Update role of user in someone chat',
      }),
      ApiOkResponse({ description: 'Role updated' }),
      ApiChatOrUserNotFound(),
      ApiUserIdParamDocs(),
      ApiBody({ type: UpdateRoleDto, required: true }),
    );
  }
}
