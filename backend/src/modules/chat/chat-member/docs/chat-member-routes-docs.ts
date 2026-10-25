import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { UpdateRoleDto } from '../dto/update-role.dto';

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
        description: 'Adds the specified user to the group chat or channel',
      }),
      ApiCreatedResponse({ description: 'User added to chat successfully' }),
      ApiUserIdDocs(),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiChatMustBeGroupOrChannelResponse(),
    );
  }

  static LeaveChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Remove a user from a group chat or channel',
        description:
          'Removes yourself from the group chat or channel by himself.',
      }),
      ApiOkResponse({ description: 'User removed from chat successfully' }),
      ApiBadRequestResponse({ description: 'Chat must be a private' }),
      UserIsNotParticipantOfChatDocs(),
      ApiChatMustBeGroupOrChannelResponse(),
      ApiVerifiedAuthDocs(),
    );
  }

  static JoinToChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Join to chat',
        description: 'Adds the authenticated user to a public group or channel',
      }),
      ApiCreatedResponse({ description: 'User added to chat successfully' }),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiBadRequestResponse({
        description: 'Only public groups and channels can be joined',
      }),
    );
  }

  static DeleteUserFromChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Remove a user from a group chat or channel',
        description:
          'Removes the specified participant from the group chat or channel. Only the chat owner or an admin can do this.',
      }),
      ApiOkResponse({ description: 'User removed from chat successfully' }),
      ApiBadRequestResponse({ description: 'Chat must be a private' }),
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
