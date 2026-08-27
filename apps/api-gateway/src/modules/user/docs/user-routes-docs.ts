import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAdminAuthDocs } from '../../../common/decorators/docs/auth';
import { ApiUserIdDocs } from './shared';

export class ApiUserRoutesDocs {
  static GetById() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get user by ID',
        description: 'Returns user by provided userId',
      }),
      ApiOkResponse({ description: 'User fetched successfully' }),
      ApiUserIdDocs(),
    );
  }

  static GetMe() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns authenticated user profile',
      }),
      ApiOkResponse({ description: 'My account fetched successfully' }),
    );
  }

  static AssignAdmin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Assign admin role',
        description: 'Grants admin role to a user (admin only)',
      }),
      ApiOkResponse({ description: 'Admin assigned successfully' }),
      ApiUserIdDocs(),
      ApiAdminAuthDocs(),
    );
  }

  static DeleteMe() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user',
        description: 'Deletes authenticated user account',
      }),
      ApiOkResponse({ description: 'My account deleted successfully' }),
    );
  }

  static DeleteUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete user by ID',
        description: 'Deletes user by ID (admin only)',
      }),
      ApiOkResponse({ description: 'User deleted successfully' }),
      ApiAdminAuthDocs(),
      ApiUserIdDocs(),
    );
  }
}
