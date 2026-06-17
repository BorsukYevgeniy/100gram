import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiPaginationDocs } from '../../../common/decorators/docs/pagination';
import { ApiUserNotFoundResponse } from '../../user/docs/shared';
import { CreateGroupChatDto } from '../dto/create-group-chat.dto';
import { CreatePrivateChatDto } from '../dto/create-private-chat.dto';
import { UpdateGroupChatDto } from '../dto/update-group-chat.dto';
import { ApiChatIdParamDocs, ApiChatNotFoundResponse } from './shared';

function ApiChatMustBeGroupResponse() {
  return ApiBadRequestResponse({ description: 'Chat must be a group' });
}

function ApiYouMustBeOwnerResponse() {
  return ApiForbiddenResponse({
    description: 'You must be an owner of chat',
  });
}

export class ChatRoutesDocs {
  static GetMyChats() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get my chats',
        description: 'Return where chats you exist with pagination and caching',
      }),
      ApiOkResponse({ description: 'Chats fetched successfully' }),
      ApiUserNotFoundResponse(),
      ApiPaginationDocs(),
    );
  }

  static CreatePrivateChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Craete private chat',
        description: 'Create chat with 1 user',
      }),
      ApiOkResponse({ description: 'Private hat created successfully' }),
      ApiUserNotFoundResponse(),
      ApiBadRequestResponse({
        description: 'You cant create chat with yourself',
      }),
      ApiBody({ type: CreatePrivateChatDto }),
    );
  }

  static CreateGroupChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create group chat',
        description: 'Create chat with many users',
      }),
      ApiOkResponse({ description: 'Group chat created successfully' }),
      ApiNotFoundResponse({ description: 'Users not found' }),
      ApiBody({ type: CreateGroupChatDto }),
    );
  }

  static AddChatByInviteToken() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add user by invite token',
        description: 'Add user to chat by invite token',
      }),
      ApiOkResponse({ description: 'User added successfully' }),
      ApiNotFoundResponse({ description: 'Token not found' }),
      ApiParam({
        name: 'inviteToken',
        type: String,
        required: true,
        description: 'Token for inviting user',
      }),
    );
  }

  static UpdateInviteToken() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update invite token',
        description: 'Update token for inviting users',
      }),
      ApiOkResponse({ description: 'Token updated successfully' }),
      ApiChatNotFoundResponse(),
      ApiYouMustBeOwnerResponse(),
      ApiChatIdParamDocs(),
    );
  }

  static GetChatById() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get chat by ID',
        description: 'Getting chat by ID',
      }),
      ApiOkResponse({ description: 'Chat fetched successfully' }),
      ApiForbiddenResponse({
        description: 'You must be a participant of chat',
      }),
      ApiChatNotFoundResponse(),
      ApiChatIdParamDocs(),
    );
  }

  static UpdateOwner() {
    return applyDecorators(
      ApiOperation({
        summary: 'Updating owner in chat by ID',
        description: 'Setting new owner in chat by ID',
      }),
      ApiOkResponse({ description: 'Owner updated successfully' }),
      ApiChatMustBeGroupResponse(),
      ApiNotFoundResponse({ description: 'Chat or new owner not found' }),
      ApiYouMustBeOwnerResponse(),
      ApiChatIdParamDocs(),
      ApiParam({
        name: 'ownerId',
        type: Number,
        required: true,
        description: 'ID of new owner',
      }),
    );
  }

  static UpdateGroupChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Updating chat by ID',
        description: 'Updated chat data by ID',
      }),
      ApiOkResponse({ description: 'Chat updated successfully' }),
      ApiChatMustBeGroupResponse(),
      ApiYouMustBeOwnerResponse(),
      ApiBody({ type: UpdateGroupChatDto }),
      ApiChatNotFoundResponse(),
      ApiChatIdParamDocs(),
    );
  }

  static DeleteChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Deleting chat by ID',
        description: 'Delete chat by ID',
      }),
      ApiOkResponse({ description: 'Chat deleted successfully' }),
      ApiChatNotFoundResponse(),
      ApiYouMustBeOwnerResponse(),
      ApiChatIdParamDocs(),
    );
  }
}
