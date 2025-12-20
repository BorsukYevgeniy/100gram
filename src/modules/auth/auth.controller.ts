import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto, @Res() res: Response) {
    const accessToken = await this.authService.register(dto);

    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
      })
      .status(201)
      .end();
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const accessToken = await this.authService.login(dto);

    res
      .cookie('access_token', accessToken, {
        httpOnly: true,
        maxAge: 2 * 24 * 60 * 60 * 1000, // 2 days
      })
      .status(200)
      .end();
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('access_token').status(200).end();
  }
}
