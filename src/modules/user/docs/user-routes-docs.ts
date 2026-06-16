import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAdminForbidden } from '../../../common/decorators/docs/auth/api-admin-forbidden.decorator';
import { ApiUserIdParamDocs } from './shared/api-user-id-docs.decorator';
import { ApiUserNotFoundResponse } from './shared/api-user-not-found-response.decorator';

export class ApiUserRoutesDocs {
  static GetById() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get user by ID',
        description: 'Returns user by provided userId',
      }),
      ApiOkResponse({ description: 'User fetched successfully' }),
      ApiUserNotFoundResponse(),
      ApiUserIdParamDocs(),
    );
  }

  static GetMe() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns authenticated user profile',
      }),
      ApiOkResponse({ description: 'My account fetched successfully' }),
      ApiUserNotFoundResponse(),
    );
  }

  static AssignAdmin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Assign admin role',
        description: 'Grants admin role to a user (admin only)',
      }),
      ApiOkResponse({ description: 'Admin assigned successfully' }),
      ApiUserNotFoundResponse(),
      ApiUserIdParamDocs(),
      ApiAdminForbidden(),
    );
  }

  static DeleteMe() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete current user',
        description: 'Deletes authenticated user account',
      }),
      ApiOkResponse({ description: 'My account deleted successfully' }),
      ApiUserNotFoundResponse(),
    );
  }

  static DeleteUser() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete user by ID',
        description: 'Deletes user by ID (admin only)',
      }),
      ApiOkResponse({ description: 'User deleted successfully' }),
      ApiUserNotFoundResponse(),
      ApiAdminForbidden(),
      ApiUserIdParamDocs(),
    );
  }
}
