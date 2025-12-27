import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

import { compare, hash } from 'bcryptjs';
import { Role } from '../../../generated/prisma/enums';
import { ConfigService } from '../config/config.service';
import { TokenService } from '../token/token.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXP: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (user)
      throw new BadRequestException(
        'User with this credentials already exists',
      );

    const hashedPassword = await hash(
      dto.password,
      this.configService.PASSWORD_SALT,
    );

    const newUser = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    return await this.tokenService.generateTokens(newUser.id, newUser.role);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) throw new BadRequestException('Invalid credentials');

    const isPasswordValid = await compare(dto.password, user.password);

    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    return await this.tokenService.generateTokens(user.id, user.role as Role);
  }

  async logout(token: string) {
    return await this.tokenService.deleteToken(token);
  }

  async logoutAll(userId: number) {
    return await this.tokenService.deleteAllUserTokens(userId);
  }

  async refresh(token: string) {
    const { id } = await this.tokenService.verifyRefreshToken(token);

    const userTokens = await this.tokenService.getUserTokens(id);

    const isTokenValid = userTokens.some((u) => u.token === token);

    if (!isTokenValid) throw new UnauthorizedException('Invalid refresh token');

    const { role } = await this.userService.findById(id);

    return await this.tokenService.update(id, role, token);
  }
}
