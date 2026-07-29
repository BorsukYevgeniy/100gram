import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';
import { ApiUserIdDocs, ApiUserIdParamDocs } from '../../../user/docs/shared';
import { ApiChatMustBeGroupResponse } from '../../docs/shared';
import { UpdateRoleDto } from '../../dto/role/update-role.dto';

function UserIsNotParticipantOfChatDocs() {
  return applyDecorators(
    ApiUserIdParamDocs(),
    ApiNotFoundResponse({
      description: 'User is not a participant of the chat',
    }),
  );
}

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
      ApiUserIdDocs(),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
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
      UserIsNotParticipantOfChatDocs(),
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
      UserIsNotParticipantOfChatDocs(),
      ApiBody({ type: UpdateRoleDto, required: true }),
    );
  }
}
