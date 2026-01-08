import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
} from '../../common/types';
import { ConfigService } from '../config/config.service';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async generateAccessToken(
    id: number,
    role: Role,
    isVerified: boolean,
  ): Promise<string> {
    return await this.jwtService.signAsync<AccessTokenPayload>(
      { id, role, isVerified },
      this.configService.ACCESS_TOKEN_CONFIG,
    );
  }

  private async generateRefreshToken(id: number): Promise<string> {
    return await this.jwtService.signAsync<RefreshTokenPayload>(
      { id },
      this.configService.REFRESH_TOKEN_CONFIG,
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.ACCESS_TOKEN_CONFIG.secret,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configService.REFRESH_TOKEN_CONFIG.secret,
    });
  }

  private async saveRefreshToken(
    userId: number,
    token: string,
  ): Promise<Token> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return await this.tokenRepository.create(userId, token, expiresAt);
  }

  async getUserTokens(userId: number): Promise<Token[]> {
    return await this.tokenRepository.getUserToken(userId);
  }

  async generateTokens(
    userId: number,
    role: Role,
    isVerified: boolean,
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, role, isVerified),
      this.generateRefreshToken(userId),
    ]);

    await this.saveRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async deleteToken(token: string): Promise<Token> {
    return await this.tokenRepository.delete(token);
  }

  async deleteAllUserTokens(userId: number) {
    return await this.tokenRepository.deleteAllUserToken(userId);
  }

  async update(
    userId: number,
    role: Role,
    isVerified: boolean,
    oldToken: string,
  ): Promise<TokenPair> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, role, isVerified),
      this.generateRefreshToken(userId),
    ]);
    await this.tokenRepository.update(oldToken, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  async deleteExpiredTokens() {
    return await this.tokenRepository.deleteExpiredTokens();
  }
}
