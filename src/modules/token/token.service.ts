import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Token } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import { AccessTokenPayload, RefreshTokenPayload } from '../../common/types';
import { ConfigService } from '../config/config.service';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRATION_TIME: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_EXPIRATION_TIME: string;

  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly ConfigService: ConfigService,
  ) {
    this.ACCESS_TOKEN_SECRET = this.ConfigService.ACCESS_TOKEN_SECRET;

    this.ACCESS_TOKEN_EXPIRATION_TIME =
      this.ConfigService.ACCESS_TOKEN_EXPIRATION_TIME;

    this.REFRESH_TOKEN_SECRET = this.ConfigService.REFRESH_TOKEN_SECRET;

    this.REFRESH_TOKEN_EXPIRATION_TIME =
      this.ConfigService.REFRESH_TOKEN_EXPIRATION_TIME;
  }

  private generateAccessToken(
    id: number,
    role: Role,
    isVerified: boolean,
  ): Promise<string> {
    return this.jwtService.signAsync<AccessTokenPayload>(
      { id, role, isVerified },
      {
        secret: this.ACCESS_TOKEN_SECRET,
        expiresIn: this.ACCESS_TOKEN_EXPIRATION_TIME,
      } as JwtSignOptions,
    );
  }

  private generateRefreshToken(id: number): Promise<string> {
    return this.jwtService.signAsync<RefreshTokenPayload>({ id }, {
      secret: this.REFRESH_TOKEN_SECRET,
      expiresIn: this.REFRESH_TOKEN_EXPIRATION_TIME,
    } as JwtSignOptions);
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.ACCESS_TOKEN_SECRET,
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.REFRESH_TOKEN_SECRET,
    });
  }

  private saveRefreshToken(userId: number, token: string): Promise<Token> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.tokenRepository.create(userId, token, expiresAt);
  }

  getUserTokens(userId: number): Promise<Token[]> {
    return this.tokenRepository.getUserToken(userId);
  }

  async generateTokens(
    userId: number,
    role: Role,
    isVerified: boolean,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, role, isVerified),
      this.generateRefreshToken(userId),
    ]);

    this.saveRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  deleteToken(token: string): Promise<Token> {
    return this.tokenRepository.delete(token);
  }

  deleteAllUserTokens(userId: number) {
    return this.tokenRepository.deleteAllUserToken(userId);
  }

  async update(
    userId: number,
    role: Role,
    isVerified: boolean,
    oldToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [accessToken, newRefreshToken] = await Promise.all([
      this.generateAccessToken(userId, role, isVerified),
      this.generateRefreshToken(userId),
    ]);

    this.tokenRepository.update(oldToken, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  deleteExpiredTokens() {
    return this.tokenRepository.deleteExpiredTokens();
  }
}
