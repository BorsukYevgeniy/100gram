import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

function ApiBlockedId() {
  return ApiParam({
    name: 'blockedId',
    type: Number,
    description: 'The ID of the user which you want to block',
    required: true,
  });
}

export class ApiBlockedUserRouterDocs {
  static GetMyBlockedUsers() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get current user blocked list',
        description: 'Returns list of users blocked by the authenticated user',
      }),
      ApiOkResponse({ description: 'Blocked users fetched successfully' }),
    );
  }

  static BlockUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Block user',
        description: 'Blocks a user by ID for the authenticated user',
      }),
      ApiCreatedResponse({ description: 'User blocked successfully' }),
      ApiBlockedId(),
    );
  }

  static UnBlockUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Unblock user',
        description: 'Removes user from blocked list',
      }),
      ApiOkResponse({ description: 'Blocked users fetched successfully' }),
      ApiBlockedId(),
    );
  }
}
