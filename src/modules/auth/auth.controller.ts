import {
  Body,
  Controller,
  Get,
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
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload, AuthRequest, TokenPair } from '../../common/types';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserNoCredVCode } from '../user/types/user.types';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { LoginDto } from './dto/login.dto';
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
  async logout(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    await this.authService.logout(req.cookies.refresh_token);
    this.clearTokenCookie(res);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  async logoutAll(
    @User() user: AccessTokenPayload,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logoutAll(user.id);
    this.clearTokenCookie(res);
  }

  @Post('verify/:verificationCode')
  verify(
    @Param('verificationCode', ParseUUIDPipe) verificationCode: string,
  ): Promise<UserNoCredVCode> {
    return this.authService.verifyUser(verificationCode);
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  async refresh(@Req() req: AuthRequest, @Res() res: Response): Promise<void> {
    const refreshTokenCookie = req.cookies.refresh_token;

    if (!refreshTokenCookie)
      throw new UnauthorizedException('Refresh token is missing');

    const tokens = await this.authService.refresh(refreshTokenCookie);

    this.setTokenCookie(res, tokens);
  }

  @Post('resend-email')
  @UseGuards(AuthGuard, ThrottlerGuard)
  resendVerificationMail(@User() user: AccessTokenPayload) {
    return this.authService.resendVerificationMail(user);
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
