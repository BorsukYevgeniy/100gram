import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiUserNotFoundResponse } from '../../docs/shared';

function ApiBlockedIdDocs() {
  return applyDecorators(
    ApiParam({
      name: 'blockedId',
      type: Number,
      description: 'The ID of the user which you want to block',
      required: true,
    }),
    ApiNotFoundResponse({ description: 'Blocked user not found' }),
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
      ApiBlockedIdDocs(),
    );
  }

  static UnBlockUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unblock user',
        description: 'Removes user from blocked list',
      }),
      ApiOkResponse({ description: 'Blocked users fetched successfully' }),
      ApiBlockedIdDocs(),
    );
  }
}
