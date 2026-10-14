import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiCookieAuth,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse as SwaggerApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiAuthDocs } from '../../../common/decorators/docs/auth';
import { ResetPasswordDto } from '../dto/reset-password.dto';

function ApiTooManyAttemptsResendEmailResponse() {
  return ApiTooManyRequestsResponse({
    description: 'Too many attempts to resend email',
  });
}

export class AuthRoutesDocs {
  static GoogleLogin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Google OAuth login',
        description: 'Redirects user to Google authentication page',
      }),
      ApiResponse({
        status: 302,
        description: 'Redirect to Google OAuth consent screen',
      }),
    );
  }

  static GoogleCallback() {
    return applyDecorators(
      ApiOperation({
        summary: 'Google OAuth callback',
        description:
          'Handles Google redirect callback, creates user session and sets auth cookies',
      }),
      ApiOkResponse({
        description: 'User authenticated successfully, cookies set',
      }),
      SwaggerApiUnauthorizedResponse({
        description: 'Invalid Google token or authentication failed',
      }),
      ApiBadRequestResponse({
        description: 'Invalid callback request',
      }),
    );
  }

  static Register() {
    return applyDecorators(
      ApiOperation({
        summary: 'Register new user',
        description: 'Creates a new user and returns auth tokens via cookies',
      }),
      ApiCreatedResponse({ description: 'User registered successfully' }),
      ApiBadRequestResponse({ description: 'Invalid input data' }),
    );
  }

  static Login() {
    return applyDecorators(
      ApiOperation({
        summary: 'Login user',
        description: 'Authenticates user and sets auth cookies',
      }),
      ApiOkResponse({ description: 'User logged in successfully' }),
      ApiBadRequestResponse({ description: 'Invalid credentials' }),
    );
  }

  static Logout() {
    return applyDecorators(
      ApiOperation({
        summary: 'Logout user',
        description: 'Logs out current session and clears cookies',
      }),
      ApiNoContentResponse({ description: 'Logged out successfully' }),
      ApiAuthDocs(),
    );
  }

  static LogoutAll() {
    return applyDecorators(
      ApiOperation({
        summary: 'Logout from all devices',
        description: 'Invalidates all user sessions',
      }),
      ApiNoContentResponse({
        description: 'Logged out from all devices successfully',
      }),
      ApiAuthDocs(),
    );
  }

  static Verify() {
    return applyDecorators(
      ApiOperation({
        summary: 'Verify user',
        description: 'Verifies user account using verification code',
      }),
      ApiOkResponse({
        description: 'User verified successfully',
      }),
      ApiParam({
        name: 'verificationCode',
        type: String,
        format: 'uuid',
        required: true,
        description: 'UUID verification code sent to the user’s email',
      }),
      ApiNotFoundResponse({ description: 'Invalid verification code' }),
      ApiBadRequestResponse({
        description:
          'Verification code must be a UUID and the user must not already be verified',
      }),
    );
  }

  static Refresh() {
    return applyDecorators(
      ApiOperation({
        summary: 'Refresh access token',
        description: 'Generates new tokens using refresh token cookie',
      }),
      ApiOkResponse({ description: 'Tokens refreshed successfully' }),
      SwaggerApiUnauthorizedResponse({
        description: 'Refresh token missing or invalid',
      }),
      ApiCookieAuth('refresh_token'),
    );
  }

  static ResendVerificationMail() {
    return applyDecorators(
      ApiOperation({
        summary: 'Resend verification email',
        description: 'Sends new verification email to authenticated user',
      }),
      ApiOkResponse({ description: 'Verification email sent' }),
      ApiAuthDocs(),
      ApiTooManyAttemptsResendEmailResponse(),
      ApiBadRequestResponse({ description: 'User is already verified' }),
    );
  }

  static SendOTPMail() {
    return applyDecorators(
      ApiOperation({
        summary: 'Send OTP email',
        description:
          'Sends a one-time code to the authenticated user’s email for password reset. Codes are sent only for local accounts.',
      }),
      ApiOkResponse({
        description: 'Generic response returned whether or not an email is sent',
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'If email exists, OTP sent',
            },
          },
          required: ['message'],
        },
      }),
      ApiAuthDocs(),
      ApiTooManyRequestsResponse({
        description: 'Too many OTP email requests',
      }),
    );
  }

  static ResetPassword() {
    return applyDecorators(
      ApiOperation({
        summary: 'Reset password',
        description:
          'Resets the password of an authenticated local account using a valid, unexpired one-time code',
      }),
      ApiOkResponse({ description: 'Password reset successfully' }),
      ApiAuthDocs(),
      ApiBody({ type: ResetPasswordDto }),
      ApiBadRequestResponse({
        description:
          'Invalid or expired OTP, invalid input, or password reset is not supported for this authentication provider',
      }),
    );
  }
}
