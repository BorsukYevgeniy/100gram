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
} from '@nestjs/swagger';
import { CreateFolderDto } from '../dto/create-folder.dto';
import { UpdateFolderDto } from '../dto/update-folder.dto';

function ApiFolderIdParam() {
  return ApiParam({
    name: 'folderId',
    type: Number,
    required: true,
    description: 'ID of the folder',
  });
}

function ApiFolderChatParams() {
  return applyDecorators(
    ApiFolderIdParam(),
    ApiParam({
      name: 'chatId',
      type: Number,
      required: true,
      description: 'ID of the chat',
    }),
  );
}

export class FolderRoutesDocs {
  static GetMyFolders() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get my folders',
        description: 'Returns all folders owned by the authenticated user',
      }),
      ApiOkResponse({
        description: 'Folders fetched successfully',
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 1 },
              name: { type: 'string', example: 'Favorites' },
              userId: { type: 'integer', example: 42 },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T10:30:00.000Z',
              },
            },
          },
        },
      }),
    );
  }

  static GetFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get folder by ID',
        description: 'Returns a folder and its chats',
      }),
      ApiOkResponse({
        description: 'Folder fetched successfully',
        schema: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Favorites' },
            chats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 12 },
                  title: { type: 'string', example: 'Project chat' },
                  avatarName: { type: 'string', nullable: true },
                  lastMessage: {
                    nullable: true,
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          text: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                      { type: 'null' },
                    ],
                  },
                  isPinned: { type: 'boolean', example: false },
                },
              },
            },
          },
        },
      }),
      ApiNotFoundResponse({ description: 'Folder not found' }),
      ApiForbiddenResponse({
        description: 'You are not the owner of the folder',
      }),
      ApiBadRequestResponse({ description: 'Folder ID is invalid' }),
      ApiFolderIdParam(),
    );
  }

  static CreateFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create folder',
        description: 'Creates a folder for the authenticated user',
      }),
      ApiCreatedResponse({ description: 'Folder created successfully' }),
      ApiBadRequestResponse({
        description: 'Folder name must contain 1 to 50 characters',
      }),
      ApiBody({ type: CreateFolderDto }),
    );
  }

  static UpdateFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update folder',
        description: 'Updates the name of a folder',
      }),
      ApiOkResponse({ description: 'Folder updated successfully' }),
      ApiBadRequestResponse({
        description: 'Folder ID or folder name is invalid',
      }),
      ApiNotFoundResponse({ description: 'Folder not found' }),
      ApiForbiddenResponse({
        description: 'You are not the owner of the folder',
      }),
      ApiBody({ type: UpdateFolderDto }),
      ApiFolderIdParam(),
    );
  }

  static DeleteFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete folder',
        description: 'Deletes a folder and its chat associations',
      }),
      ApiOkResponse({ description: 'Folder deleted successfully' }),
      ApiBadRequestResponse({ description: 'Folder ID is invalid' }),
      ApiNotFoundResponse({ description: 'Folder not found' }),
      ApiForbiddenResponse({
        description: 'You are not the owner of the folder',
      }),
      ApiFolderIdParam(),
    );
  }

  static AddChatToFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Add chat to folder',
        description: 'Adds a chat the authenticated user participates in',
      }),
      ApiCreatedResponse({ description: 'Chat added to folder successfully' }),
      ApiBadRequestResponse({
        description: 'Folder ID or chat ID is invalid',
      }),
      ApiNotFoundResponse({ description: 'Folder or chat not found' }),
      ApiForbiddenResponse({
        description: 'You cannot modify the folder or do not participate in the chat',
      }),
      ApiConflictResponse({ description: 'Chat is already in the folder' }),
      ApiFolderChatParams(),
    );
  }

  static RemoveChatFromFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Remove chat from folder',
        description: 'Removes a chat association from a folder',
      }),
      ApiOkResponse({ description: 'Chat removed from folder successfully' }),
      ApiBadRequestResponse({
        description: 'Folder ID or chat ID is invalid',
      }),
      ApiNotFoundResponse({ description: 'Folder or chat not found' }),
      ApiForbiddenResponse({
        description: 'You cannot modify the folder or do not participate in the chat',
      }),
      ApiConflictResponse({ description: 'Chat is not in the folder' }),
      ApiFolderChatParams(),
    );
  }

  static PinChatInFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Pin chat in folder',
        description: 'Pins a chat to the top of a folder',
      }),
      ApiOkResponse({ description: 'Chat pinned in folder successfully' }),
      ApiBadRequestResponse({
        description: 'Folder ID or chat ID is invalid',
      }),
      ApiNotFoundResponse({ description: 'Folder or chat not found' }),
      ApiForbiddenResponse({
        description: 'You cannot modify the folder or do not participate in the chat',
      }),
      ApiConflictResponse({ description: 'Chat is not in the folder' }),
      ApiFolderChatParams(),
    );
  }

  static UnpinChatInFolder() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unpin chat in folder',
        description: 'Unpins a chat in a folder',
      }),
      ApiOkResponse({ description: 'Chat unpinned in folder successfully' }),
      ApiBadRequestResponse({
        description: 'Folder ID or chat ID is invalid',
      }),
      ApiNotFoundResponse({ description: 'Folder or chat not found' }),
      ApiForbiddenResponse({
        description: 'You cannot modify the folder or do not participate in the chat',
      }),
      ApiConflictResponse({ description: 'Chat is not in the folder' }),
      ApiFolderChatParams(),
    );
  }
}
