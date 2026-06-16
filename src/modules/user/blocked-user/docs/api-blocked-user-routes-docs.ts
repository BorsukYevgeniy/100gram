import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiUserNotFoundResponse } from '../../docs/shared';
import { ApiBlockedId } from './shared/api-blocked-id.decorator';

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
      ApiUserNotFoundResponse(),
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
      ApiUserNotFoundResponse(),
      ApiBlockedId(),
    );
  }
}
