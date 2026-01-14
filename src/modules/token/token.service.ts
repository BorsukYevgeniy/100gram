import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TokenService.name);
  }

  private async generateAccessToken(
    userId: number,
    role: Role,
    isVerified: boolean,
  ): Promise<string> {
    return this.jwtService.signAsync<AccessTokenPayload>(
      { id: userId, role, isVerified },
      this.configService.ACCESS_TOKEN_CONFIG,
    );
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    return this.jwtService.signAsync<RefreshTokenPayload>(
      { id: userId },
      this.configService.REFRESH_TOKEN_CONFIG,
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: this.configService.ACCESS_TOKEN_CONFIG.secret,
      },
    );

    this.logger.debug({ userId: payload.id }, 'Access token verified');

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      token,
      {
        secret: this.configService.REFRESH_TOKEN_CONFIG.secret,
      },
    );

    this.logger.debug({ userId: payload.id }, 'Refresh token verified');

    return payload;
  }

  private async saveRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<Token> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = await this.tokenRepository.create(
      userId,
      refreshToken,
      expiresAt,
    );

    return token;
  }

  async getUserTokens(userId: number): Promise<Token[]> {
    return this.tokenRepository.getUserToken(userId);
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

    this.logger.info({ userId }, 'Token pair generated');

    return { accessToken, refreshToken };
  }

  async deleteToken(token: string): Promise<Token> {
    const deletedToken = await this.tokenRepository.delete(token);

    this.logger.info({ userId: deletedToken.userId }, 'Token deleted');

    return deletedToken;
  }

  async deleteAllUserTokens(userId: number) {
    const { count } = await this.tokenRepository.deleteAllUserToken(userId);

    this.logger.info({ userId, count }, 'All user tokens deleted');

    return count;
  }

  async update(
    userId: number,
    role: Role,
    isVerified: boolean,
    oldToken: string,
  ): Promise<TokenPair> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, role, isVerified),
      this.generateRefreshToken(userId),
    ]);

    await this.tokenRepository.update(oldToken, refreshToken, expiresAt);

    this.logger.info({ userId }, 'Token pair rotated');

    return { accessToken, refreshToken };
  }

  async deleteExpiredTokens() {
    const { count } = await this.tokenRepository.deleteExpiredTokens();

    this.logger.debug({ count }, 'Expired tokens deleted');

    return count;
  }
}
