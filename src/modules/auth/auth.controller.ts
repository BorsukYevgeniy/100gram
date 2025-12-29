import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload } from '../../common/interfaces';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { GoogleGuard } from './guards/google.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.register(dto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    res
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(201)
      .end();
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    res
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .end();
  }

  @Post('refresh')
  @UseGuards(AuthGuard)
  async refresh(@Req() req: AuthRequest, @Res() res: Response) {
    const refreshTokenCookie = req.cookies.refresh_token;

    if (!refreshTokenCookie)
      throw new UnauthorizedException('Refresh token is missing');

    const { accessToken, refreshToken } =
      await this.authService.refresh(refreshTokenCookie);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    res
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .end();
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token').status(200).end();
  }

  @Post('logout-all')
  @UseGuards(AuthGuard)
  async logoutAll(@User() user: AccessTokenPayload, @Res() res: Response) {
    await this.authService.logoutAll(user.id);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token').status(200).end();
  }

  @Public()
  @Get('google/login')
  @UseGuards(GoogleGuard)
  async googleLogin() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleCallback(@Req() req: AuthRequest, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginById(
      req.user.id,
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    res
      .cookie('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .end();
  }
}
