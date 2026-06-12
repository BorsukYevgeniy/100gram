import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { AccessTokenPayload, AuthRequest, TokenPair } from '../../common/types';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserNoCredOtpVCode } from '../user/types/user.types';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './guards/auth.guard';
import { GoogleGuard } from './guards/google.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Google OAuth login',
    description: 'Redirects user to Google authentication page',
  })
  @ApiOkResponse({
    description: 'Redirect to Google OAuth consent screen',
  })
  @Public()
  @Get('google/login')
  @UseGuards(GoogleGuard)
  async googleLogin(): Promise<void> {}

  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Handles Google redirect callback, creates user session and sets auth cookies',
  })
  @ApiOkResponse({
    description: 'User authenticated successfully, cookies set',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid Google token or authentication failed',
  })
  @ApiBadRequestResponse({
    description: 'Invalid callback request',
  })
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    const tokens = await this.authService.loginById(req.user.id);

    this.setTokenCookie(res, tokens);
  }

  @ApiOperation({
    summary: 'Register new user',
    description: 'Creates a new user and returns auth tokens via cookies',
  })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res() res: Response) {
    const tokens = await this.authService.register(dto);

    this.setTokenCookie(res, tokens, 201);
  }

  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates user and sets auth cookies',
  })
  @ApiOkResponse({ description: 'User logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const tokens = await this.authService.login(dto);

    this.setTokenCookie(res, tokens);
  }

  @ApiOperation({
    summary: 'Logout user',
    description: 'Logs out current session and clears cookies',
  })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logout(req.cookies.refresh_token, user.id);
    this.clearTokenCookie(res);
  }

  @ApiOperation({
    summary: 'Logout from all devices',
    description: 'Invalidates all user sessions',
  })
  @ApiOkResponse({ description: 'Logged out from all devices successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('logout-all')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: AccessTokenPayload,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user.id);
    this.clearTokenCookie(res);
  }

  @ApiOperation({
    summary: 'Verify user',
    description: 'Verifies user account using verification code',
  })
  @ApiOkResponse({
    description: 'User verified successfully',
  })
  @ApiNotFoundResponse({ description: 'Invalid verification code' })
  @Post('verify/:verificationCode')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('verificationCode', ParseUUIDPipe) verificationCode: string,
  ): Promise<UserNoCredOtpVCode> {
    return this.authService.verifyUser(verificationCode);
  }

  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generates new tokens using refresh token cookie',
  })
  @ApiOkResponse({ description: 'Tokens refreshed successfully' })
  @ApiUnauthorizedResponse({ description: 'Refresh token missing or invalid' })
  @Post('refresh')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    const refreshTokenCookie = req.cookies.refresh_token;

    if (!refreshTokenCookie)
      throw new UnauthorizedException('Refresh token is missing');

    const tokens = await this.authService.refresh(refreshTokenCookie);

    this.setTokenCookie(res, tokens);
  }

  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Sends new verification email to authenticated user',
  })
  @ApiOkResponse({ description: 'Verification email sent' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('resend-verification-email')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerificationMail(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.resendVerificationMail(user);
  }

  @ApiOperation({
    summary: 'Send OTP email',
    description: 'Sends OTP code to user email for verification',
  })
  @ApiOkResponse({ description: 'OTP sent (if email exists)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('send-otp-email')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async sendOtpMail(@CurrentUser() user: AccessTokenPayload) {
    await this.authService.sendOtp(user.id);
    return { message: 'If email exists, OTP sent' };
  }

  @ApiOperation({
    summary: 'Reset password',
    description: 'Allows authenticated user to reset password',
  })
  @ApiOkResponse({ description: 'Password reset successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @Post('reset-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.authService.resetPassword(user.id, dto);
    return { message: 'Password reseted' };
  }

  private setTokenCookie(
    res: Response,
    tokens: TokenPair,
    status: 200 | 201 = 200,
  ) {
    const { accessToken, refreshToken } = tokens;

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    res
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(status)
      .end();
  }

  private clearTokenCookie(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token').status(200).end();
  }
}
