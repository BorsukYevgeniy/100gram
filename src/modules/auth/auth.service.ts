import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

import { compare, hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import { AccessTokenPayload, TokenPair } from '../../common/types';
import { ConfigService } from '../config/config.service';
import { MailService } from '../mail/mail.service';
import { TokenService } from '../token/token.service';
import { UserNoCredOtpVCode } from '../user/types/user.types';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  async register(dto: CreateUserDto): Promise<TokenPair> {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      this.logger.warn(
        { email: dto.email },
        'Attempt to register already existing user',
      );
      throw new BadRequestException(
        'User with this credentials already exists',
      );
    }

    const hashedPassword = await hash(
      dto.password,
      this.configService.PASSWORD_SALT,
    );

    const { id, email, role, verificationCode, isVerified } =
      await this.userService.create({
        ...dto,
        password: hashedPassword,
      });

    this.logger.info(
      { userId: id, email, role },
      'User registered successfully',
    );

    await this.mailService.sendVerificationMail(email, verificationCode);

    return await this.tokenService.generateTokens(id, role, isVerified);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user) {
      this.logger.warn(
        { email: dto.email },
        'Attempt to login into non-existent user',
      );
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await compare(dto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn({ userId: user.id }, 'Password not valid');
      throw new BadRequestException('Invalid credentials');
    }

    this.logger.info(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
      'User logged in successfully',
    );

    return await this.tokenService.generateTokens(
      user.id,
      user.role as Role,
      user.isVerified,
    );
  }

  async loginById(userId: number): Promise<TokenPair> {
    const user = await this.userService.findFullUserById(userId);

    if (!user) {
      this.logger.warn({ userId }, 'Attempt to login into non-existent user');
      throw new BadRequestException('Invalid credentials');
    }

    this.logger.info(
      { userId: user.id, role: user.role, isVerified: user.isVerified },
      'User logged in by id successfully',
    );

    return await this.tokenService.generateTokens(
      user.id,
      user.role as Role,
      user.isVerified,
    );
  }

  async logout(token: string, userId: number) {
    await this.tokenService.deleteToken(token);
    this.logger.info({ userId }, 'User logged out');
  }

  async logoutAll(userId: number) {
    await this.tokenService.deleteAllUserTokens(userId);
    this.logger.info({ userId }, 'User logged out from all devices');
  }

  async refresh(token: string): Promise<TokenPair> {
    const { id } = await this.tokenService.verifyRefreshToken(token);

    const userTokens = await this.tokenService.getUserTokens(id);

    const isTokenValid = userTokens.some((u) => u.token === token);

    if (!isTokenValid) {
      this.logger.warn({ userId: id }, 'Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { role, isVerified } = await this.userService.findFullUserById(id);

    this.logger.info({ userId: id, role, isVerified }, 'Token refreshed');

    return await this.tokenService.update(id, role, isVerified, token);
  }

  async verifyUser(verificationCode: string): Promise<UserNoCredOtpVCode> {
    const user: User | null =
      await this.userService.getUserByVerificationCode(verificationCode);

    if (!user) {
      this.logger.warn({}, 'Attempt to verify non-existent user');
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      this.logger.warn(
        { userId: user.id },
        'Attempt to verify already verified user',
      );
      throw new BadRequestException('User already verified');
    }

    this.logger.info(
      { userId: user.id, isVerified: user.isVerified },
      'User verified',
    );

    return await this.userService.verify(verificationCode);
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);

    if (user) {
      this.logger.info(
        { userId: user.id, role: user.role, isVerified: user.isVerified },
        'User validated via Google',
      );
      return user;
    }

    const createdUser = await this.userService.createGoogleUser(googleUser);

    this.logger.info(
      {
        userId: createdUser.id,
        role: createdUser.role,
        isVerified: createdUser.isVerified,
      },
      'User created and validated via Google',
    );

    return createdUser;
  }

  async resendVerificationMail(user: AccessTokenPayload) {
    if (user.isVerified) {
      this.logger.warn('Attempt to verify already verified user', {
        userId: user.id,
      });

      throw new BadRequestException('User already verified');
    }

    const { verificationCode, email } = await this.userService.findFullUserById(
      user.id,
    );

    this.logger.info('Verification email resent successfully', {
      userId: user.id,
      email,
    });

    return await this.mailService.sendVerificationMail(email, verificationCode);
  }

  async sendOtp(userId: number) {
    const user = await this.userService.findFullUserById(userId);

    if (!user) {
      this.logger.warn({ userId }, 'Attempt to send OTP to non-existent user');
      return;
    }

    const otp = randomInt(100_000, 1_000_000);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpHash = await hash(otp.toString(), 10);

    await this.userService.addOtpToUser(user.id, otpHash, otpExpiresAt);
    return this.mailService.sendOtpMail(user.email, otp);
  }

  async resetPassword(userId: number, dto: ResetPasswordDto) {
    const user = await this.userService.findFullUserById(userId);

    if (!user) {
      this.logger.warn(
        { userId },
        'Attempt to reset password for non-existent user',
      );
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date() ||
      user.otpAttempts >= 5
    ) {
      this.logger.warn(
        { userId },
        'Expired OTP or too many attempts to reset password',
      );
      throw new BadRequestException('Invalid or expired OTP');
    }

    const isOtpValid = await compare(dto.code.toString(), user.otpHash);

    if (!isOtpValid) {
      await this.userService.incrementOtpAttempts(userId);
      this.logger.warn({ userId }, 'Invalid OTP code');
      throw new BadRequestException('Invalid or expired OTP');
    }

    const newPasswordHash = await hash(
      dto.newPassword,
      this.configService.PASSWORD_SALT,
    );

    await this.userService.resetPasswordWithOtp(userId, newPasswordHash);
  }
}
