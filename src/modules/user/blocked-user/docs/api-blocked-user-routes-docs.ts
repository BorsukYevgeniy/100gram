import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiUserNotFoundResponse } from '../../docs/shared';

function ApiBlockedIdDocs(description: string, notFoundDescription: string) {
  return applyDecorators(
    ApiParam({
      name: 'blockedId',
      type: Number,
      description,
      required: true,
      schema: { minimum: 1 },
    }),
    ApiNotFoundResponse({ description: notFoundDescription }),
  );
}

export class ApiBlockedUserRouterDocs {
  static GetMyBlockedUsers() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get current user blocked list',
        description: 'Returns list of users blocked by the authenticated user',
      }),
      ApiOkResponse({ description: 'Blocked users fetched successfully' }),
      ApiUserNotFoundResponse(),
    );
  }

  static BlockUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Block user',
        description: 'Blocks a user by ID for the authenticated user',
      }),
      ApiCreatedResponse({ description: 'User blocked successfully' }),
      ApiBlockedIdDocs('ID of the user to block', 'User not found'),
      ApiBadRequestResponse({
        description:
          'blockedId must be a positive integer and cannot be your own user ID',
      }),
    );
  }

  static UnBlockUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unblock user',
        description: 'Removes user from blocked list',
      }),
      ApiOkResponse({ description: 'User unblocked successfully' }),
      ApiBlockedIdDocs(
        'ID of the user to unblock',
        'User not found or is not in the blocked list',
      ),
      ApiBadRequestResponse({
        description:
          'blockedId must be a positive integer and cannot be your own user ID',
      }),
    );
  }
}
