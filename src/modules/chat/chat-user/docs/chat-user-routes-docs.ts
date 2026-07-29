import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';
import {
  ApiUserIdParamDocs,
  ApiUserNotFoundResponse,
} from '../../../user/docs/shared';
import { ApiChatMustBeGroupResponse } from '../../docs/shared';
import { UpdateRoleDto } from '../../dto/role/update-role.dto';

export class ChatUserRoutesDocs {
  static GetUsersInChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Fetch all users in chat',
        description: 'Return all users in someone chat with pagination',
      }),
      ApiOkResponse({ description: 'Fetched users in chat' }),
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
      ApiUserNotFoundResponse(),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiUserIdParamDocs(),
      ApiChatMustBeGroupResponse(),
    );
  }

  static DeleteUserFromChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete users to chat',
        description: 'Delete a user from someone chat',
      }),
      ApiOkResponse({ description: 'User deleted' }),
      ApiNotFoundResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiUserIdParamDocs(),
      ApiChatMustBeGroupResponse(),
    );
  }

  static UpdateUserRole() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update role of user in chat',
        description: 'Update role of user in someone chat',
      }),
      ApiOkResponse({ description: 'Role updated' }),
      ApiNotFoundResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiUserIdParamDocs(),
      ApiBody({ type: UpdateRoleDto, required: true }),
    );
  }
}
