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
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiVerifiedAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiPaginationDocs } from '../../../common/decorators/docs/pagination';
import { ApiUserNotFoundResponse } from '../../user/docs/shared';
import { ChannelGroupChatResponseDto } from '../dto/channel-group-chat-response.dto';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateGroupChatDto } from '../dto/create-group-chat.dto';
import { CreatePrivateChatDto } from '../dto/create-private-chat.dto';
import { PrivateChatResponseDto } from '../dto/private-chat-response.dto';
import { UpdateGroupChatDto } from '../dto/update-group-chat.dto';
import {
  ApiChatIdDocs,
  ApiChatMustBeGroupResponse,
  ApiYouMustBeChatOwnerResponse,
} from './shared';

export class ChatRoutesDocs {
  static GetMyChats() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get my chats',
        description: 'Returns chats you belong to with pagination and caching',
      }),
      ApiOkResponse({ description: 'Chats fetched successfully' }),
      ApiPaginationDocs(),
    );
  }

  static CreatePrivateChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create private chat',
        description: 'Create chat with 1 user',
      }),
      ApiCreatedResponse({
        description: 'Private chat created successfully',
        type: PrivateChatResponseDto,
      }),
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
      ApiCreatedResponse({
        description: 'Group chat created successfully',
        type: ChannelGroupChatResponseDto,
      }),
      ApiNotFoundResponse({ description: 'Users not found' }),
      ApiConflictResponse({
        description: 'Owner cannot be a member of the group chat',
      }),
      ApiBody({ type: CreateGroupChatDto }),
    );
  }

  static CreateChannel() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create channel chat',
        description: 'Create channel with many users',
      }),
      ApiCreatedResponse({
        description: 'Channel created successfully',
        type: ChannelGroupChatResponseDto,
      }),
      ApiBody({ type: CreateChannelDto }),
    );
  }

  static AddChatByInviteToken() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add user by invite token',
        description:
          'Adds the authenticated user to a group chat by invite token',
      }),
      ApiOkResponse({ description: 'User added successfully' }),
      ApiNotFoundResponse({
        description: 'Chat not found for this invite token',
      }),
      ApiConflictResponse({
        description: 'User is already a participant of the chat',
      }),
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
      ApiChatMustBeGroupResponse(),
      ApiYouMustBeChatOwnerResponse(),
      ApiVerifiedAuthDocs(),
      ApiChatIdDocs(),
    );
  }

  static GetChatById() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get chat by ID',
        description: 'Getting chat by ID',
      }),
      ApiOkResponse({
        description: 'Chat fetched successfully',
        schema: {
          oneOf: [
            { $ref: getSchemaPath(PrivateChatResponseDto) },
            { $ref: getSchemaPath(ChannelGroupChatResponseDto) },
          ],
        },
      }),
      ApiForbiddenResponse({
        description: 'You must be a participant of the chat or an admin',
      }),
      ApiVerifiedAuthDocs(),
      ApiChatIdDocs(),
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
      ApiNotFoundResponse({ description: 'New owner not found' }),
      ApiYouMustBeChatOwnerResponse(),
      ApiVerifiedAuthDocs(),
      ApiChatIdDocs(),
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
        description: 'Updates a group chat or channel by ID',
      }),
      ApiOkResponse({ description: 'Chat updated successfully' }),
      ApiBadRequestResponse({
        description: 'Chat must be a group or a channel',
      }),
      ApiYouMustBeChatOwnerResponse(),
      ApiVerifiedAuthDocs(),
      ApiBody({ type: UpdateGroupChatDto }),
      ApiChatIdDocs(),
    );
  }

  static DeleteChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Deleting chat by ID',
        description: 'Delete chat by ID',
      }),
      ApiOkResponse({ description: 'Chat deleted successfully' }),
      ApiVerifiedAuthDocs(),
      ApiYouMustBeChatOwnerResponse(),
      ApiChatIdDocs(),
    );
  }

  static JoinToChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Join to chat',
        description:
          'Adds the authenticated user to a public group or channel',
      }),
      ApiOkResponse({ description: 'User added to chat successfully' }),
      ApiChatIdDocs(),
      ApiConflictResponse({
        description: 'User already is a participant of the chat',
      }),
      ApiBadRequestResponse({
        description: 'Only public groups and channels can be joined',
      }),
    );
  }

  static PinChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Pin chat',
        description: 'Pins the chat to the top of the list',
      }),
      ApiOkResponse({ description: 'Chat pinned successfully' }),
      ApiVerifiedAuthDocs(),
      ApiForbiddenResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiChatIdDocs(),
    );
  }

  static UnpinChat() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unpin chat',
        description: 'Unpins the chat from the top of the list',
      }),
      ApiOkResponse({ description: 'Chat unpinned successfully' }),
      ApiVerifiedAuthDocs(),
      ApiForbiddenResponse({
        description: 'User is not a participant of the chat',
      }),
      ApiChatIdDocs(),
    );
  }
}
