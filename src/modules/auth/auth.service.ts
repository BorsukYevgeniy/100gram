import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { JwtPayload } from '../../common/interfaces';
import { ConfigService } from '../config/config.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXP: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    this.ACCESS_TOKEN_EXP = this.configService.ACCESS_TOKEN_EXP;
    this.ACCESS_TOKEN_SECRET = this.configService.ACCESS_TOKEN_SECRET;
  }

  private async generateAccessToken(id: number) {
    return await this.jwtService.signAsync<JwtPayload>({ id }, {
      secret: this.ACCESS_TOKEN_SECRET,
      expiresIn: this.ACCESS_TOKEN_EXP,
    } as JwtSignOptions);
  }

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

    return await this.generateAccessToken(newUser.id);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) throw new BadRequestException('Invalid credentials');

    const isPasswordValid = await compare(dto.password, user.password);

    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    return await this.generateAccessToken(user.id);
  }
}
