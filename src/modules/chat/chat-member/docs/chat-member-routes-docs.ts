import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../../common/decorators/docs/auth';
import { ApiPaginationDocs } from '../../../../common/decorators/docs/pagination';
import { ApiUserIdDocs, ApiUserIdParamDocs } from '../../../user/docs/shared';
import {
  ApiChatMustBeGroupOrChannelResponse,
  ApiYouMustBeChatOwnerResponse,
} from '../../docs/shared';
import { UpdateRoleDto } from '../../dto/role/update-role.dto';

function UserIsNotParticipantOfChatDocs() {
  return applyDecorators(
    ApiUserIdParamDocs(),
    ApiNotFoundResponse({
      description: 'User is not a participant of the chat',
    }),
  );
}

export class ChatMemberRoutesDocs {
  static GetUsersInChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Fetch all users in chat',
        description:
          'Returns the users who belong to the chat, ordered by user ID and paginated',
      }),
      ApiOkResponse({ description: 'Fetched users in chat' }),
      ApiVerifiedAuthDocs(),
      ApiForbiddenResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiPaginationDocs(),
    );
  }

  static AddUserToChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add a user to a group chat',
        description: 'Adds the specified user to the group chat',
      }),
      ApiCreatedResponse({ description: 'User added to chat successfully' }),
      ApiUserIdDocs(),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiChatMustBeGroupOrChannelResponse(),
    );
  }

  static DeleteUserFromChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Remove a user from a group chat',
        description:
          'Removes the specified participant from the group chat. Only the chat owner or an admin can do this.',
      }),
      ApiOkResponse({ description: 'User removed from chat successfully' }),
      UserIsNotParticipantOfChatDocs(),
      ApiChatMustBeGroupOrChannelResponse(),
      ApiYouMustBeChatOwnerResponse(),
      ApiVerifiedAuthDocs(),
    );
  }

  static UpdateUserRole() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update role of user in chat',
        description:
          'Updates the role of a chat participant. Only the chat owner or an admin can do this.',
      }),
      ApiOkResponse({ description: 'User role updated successfully' }),
      UserIsNotParticipantOfChatDocs(),
      ApiBody({ type: UpdateRoleDto, required: true }),
      ApiVerifiedAuthDocs(),
      ApiYouMustBeChatOwnerResponse(),
    );
  }
}
