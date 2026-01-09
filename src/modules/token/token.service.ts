import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from '../../../dist/src/common/types/token-payload.types';
import { Token } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import { RefreshTokenPayload, TokenPair } from '../../common/types';
import { ConfigService } from '../config/config.service';
import { TokenRepository } from './token.repository';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
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
    const token = await this.jwtService.signAsync<AccessTokenPayload>(
      { id, role, isVerified },
      this.configService.ACCESS_TOKEN_CONFIG,
    );

    this.logger.log(`Generated access token for user ${id} successfully`);
    return token;
  }

  private async generateRefreshToken(id: number): Promise<string> {
    const token = await this.jwtService.signAsync<RefreshTokenPayload>(
      { id },
      this.configService.REFRESH_TOKEN_CONFIG,
    );

    this.logger.log(`Generated refresh token for user ${id} successfully`);
    return token;
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
      token,
      {
        secret: this.configService.ACCESS_TOKEN_CONFIG.secret,
      },
    );

    this.logger.log(
      `Verified access token for user ${payload.id} successfully`,
    );

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      token,
      {
        secret: this.configService.REFRESH_TOKEN_CONFIG.secret,
      },
    );

    this.logger.log(
      `Verified refresh token for user ${payload.id} successfully`,
    );

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

    this.logger.log(`Saved refresh token user ${userId} to db successfully`);
    return token;
  }

  async getUserTokens(userId: number): Promise<Token[]> {
    const tokens = await this.tokenRepository.getUserToken(userId);

    this.logger.log(
      `Fetched tokens ${tokens.length} for user ${userId} successfully `,
    );

    return tokens;
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

    this.logger.log(`Generated token pair for user ${userId} successfully`);

    return {
      accessToken,
      refreshToken,
    };
  }

  async deleteToken(token: string): Promise<Token> {
    const deletedToken = await this.tokenRepository.delete(token);

    this.logger.log(
      `Deleted token for user ${deletedToken.userId}successfully`,
    );
    return deletedToken;
  }

  async deleteAllUserTokens(userId: number) {
    const { count } = await this.tokenRepository.deleteAllUserToken(userId);

    this.logger.log(`Deleted ${count} token for user ${userId}`);
    return count;
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

    this.logger.log(`Updated token for user ${userId}`);

    return {
      accessToken,
      refreshToken,
    };
  }

  async deleteExpiredTokens() {
    const { count } = await this.tokenRepository.deleteExpiredTokens();

    this.logger.log(`Deleted ${count} expired tokens`);
    return count;
  }
}
