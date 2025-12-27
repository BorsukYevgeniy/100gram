import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Token } from '../../../generated/prisma/browser';
import { Role } from '../../../generated/prisma/enums';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../common/interfaces';
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

  private async generateAccessToken(id: number, role: Role): Promise<string> {
    return await this.jwtService.signAsync<AccessTokenPayload>({ id, role }, {
      secret: this.ACCESS_TOKEN_SECRET,
      expiresIn: this.ACCESS_TOKEN_EXPIRATION_TIME,
    } as JwtSignOptions);
  }

  private async generateRefreshToken(id: number): Promise<string> {
    return await this.jwtService.signAsync<RefreshTokenPayload>({ id }, {
      secret: this.REFRESH_TOKEN_SECRET,
      expiresIn: this.REFRESH_TOKEN_EXPIRATION_TIME,
    } as JwtSignOptions);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.ACCESS_TOKEN_SECRET,
    });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.REFRESH_TOKEN_SECRET,
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(userId, role);
    const refreshToken = await this.generateRefreshToken(userId);

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
    oldToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const expiresAt: Date = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const accessToken = await this.generateAccessToken(userId, role);
    const newRefreshToken = await this.generateRefreshToken(userId);

    await this.tokenRepository.update(oldToken, newRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
