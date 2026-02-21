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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google/login')
  @UseGuards(GoogleGuard)
  async googleLogin(): Promise<void> {}

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

  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res() res: Response) {
    const tokens = await this.authService.register(dto);

    this.setTokenCookie(res, tokens, 201);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const tokens = await this.authService.login(dto);

    this.setTokenCookie(res, tokens);
  }

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

  @Post('verify/:verificationCode')
  @HttpCode(HttpStatus.OK)
  async verify(
    @Param('verificationCode', ParseUUIDPipe) verificationCode: string,
  ): Promise<UserNoCredOtpVCode> {
    return this.authService.verifyUser(verificationCode);
  }

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

  @Post('resend-verification-email')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerificationMail(@CurrentUser() user: AccessTokenPayload) {
    return this.authService.resendVerificationMail(user);
  }

  @Post('send-otp-email')
  @UseGuards(AuthGuard, ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async sendOtpMail(@CurrentUser() user: AccessTokenPayload) {
    await this.authService.sendOtp(user.id);
    return { message: 'If email exists, OTP sent' };
  }

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
