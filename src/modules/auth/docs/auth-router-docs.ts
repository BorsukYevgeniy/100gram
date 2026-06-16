import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiInvalidDto } from '../../../common/decorators/docs/validation';
import { ResetPasswordDto } from '../dto/reset-password.dto';

export class AuthRoutesDocs {
  static GoogleLogin() {
    return applyDecorators(
      ApiOperation({
        summary: 'Google OAuth login',
        description: 'Redirects user to Google authentication page',
      }),
      ApiOkResponse({
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
      ApiUnauthorizedResponse({
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
      ApiInvalidDto(),
    );
  }

  static Login() {
    return applyDecorators(
      ApiOperation({
        summary: 'Login user',
        description: 'Authenticates user and sets auth cookies',
      }),
      ApiOkResponse({ description: 'User logged in successfully' }),
      ApiUnauthorizedResponse({ description: 'Invalid credentials' }),
    );
  }

  static Logout() {
    return applyDecorators(
      ApiOperation({
        summary: 'Logout user',
        description: 'Logs out current session and clears cookies',
      }),
      ApiOkResponse({ description: 'Logged out successfully' }),
      ApiUnauthorizedResponse(),
    );
  }

  static LogoutAll() {
    return applyDecorators(
      ApiOperation({
        summary: 'Logout from all devices',
        description: 'Invalidates all user sessions',
      }),
      ApiOkResponse({
        description: 'Logged out from all devices successfully',
      }),
      ApiUnauthorizedResponse(),
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
      ApiNotFoundResponse({ description: 'Invalid verification code' }),
    );
  }

  static Refresh() {
    return applyDecorators(
      ApiOperation({
        summary: 'Refresh access token',
        description: 'Generates new tokens using refresh token cookie',
      }),
      ApiOkResponse({ description: 'Tokens refreshed successfully' }),
      ApiUnauthorizedResponse({
        description: 'Refresh token missing or invalid',
      }),
    );
  }

  static ResendVerificationMail() {
    return applyDecorators(
      ApiOperation({
        summary: 'Resend verification email',
        description: 'Sends new verification email to authenticated user',
      }),
      ApiOkResponse({ description: 'Verification email sent' }),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
      ApiTooManyRequestsResponse({
        description: 'Too many attempts to resend email',
      }),
    );
  }

  static SendOTPMail() {
    return applyDecorators(
      ApiOperation({
        summary: 'Send OTP email',
        description: 'Sends OTP code to user email for verification',
      }),
      ApiOkResponse({ description: 'OTP sent (if email exists)' }),
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
      ApiTooManyRequestsResponse({
        description: 'Too many attempts to resend email',
      }),
    );
  }

  static ResetPassword() {
    return applyDecorators(
      ApiOperation({
        summary: 'Reset password',
        description: 'Allows authenticated user to reset password',
      }),
      ApiOkResponse({ description: 'Password reset successfully' }),
      ApiUnauthorizedResponse(),
      ApiBody({ type: ResetPasswordDto }),
    );
  }
}
