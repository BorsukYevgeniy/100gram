import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

import { compare, hash } from 'bcryptjs';
import { User } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import { ConfigService } from '../config/config.service';
import { MailService } from '../mail/mail.service';
import { TokenService } from '../token/token.service';
import { UserNoCredVLink } from '../user/types/user.types';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
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

    const { id, email, role, verificationLink, isVerified } =
      await this.userService.create({
        ...dto,
        password: hashedPassword,
      });

    await this.mailService.sendVerificationMail(email, verificationLink);

    return await this.tokenService.generateTokens(id, role, isVerified);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) throw new BadRequestException('Invalid credentials');

    const isPasswordValid = await compare(dto.password, user.password);

    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

    return await this.tokenService.generateTokens(
      user.id,
      user.role as Role,
      user.isVerified,
    );
  }

  async loginById(userId: number) {
    const user = await this.userService.findById(userId);

    if (!user) throw new BadRequestException('Invalid credentials');

    return await this.tokenService.generateTokens(
      user.id,
      user.role as Role,
      user.isVerified,
    );
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

    const { role, isVerified } = await this.userService.findById(id);

    return await this.tokenService.update(id, role, isVerified, token);
  }

  async verifyUser(verificationLink: string): Promise<UserNoCredVLink> {
    const user: User | null =
      await this.userService.getUserByVerificationLink(verificationLink);

    if (!user) throw new NotFoundException('User not found');

    if (user.isVerified) throw new BadRequestException('User already verified');

    return await this.userService.verify(verificationLink);
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);

    if (user) return user;

    return await this.userService.create(googleUser);
  }
}
