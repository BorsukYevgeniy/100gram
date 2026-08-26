import { AccessTokenPayload } from '@app/contracts/auth';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Role as PrismaRole } from '../../../generated/prisma/enums';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @MessagePattern('token.verifyAccessToken')
  async verifyAccessToken(@Payload() token: string) {
    return this.tokenService.verifyAccessToken(token);
  }

  @MessagePattern('token.verifyRefreshToken')
  async verifyRefreshToken(@Payload() token: string) {
    return this.tokenService.verifyRefreshToken(token);
  }

  @MessagePattern('token.getUserTokens')
  async getUserTokens(@Payload() userId: number) {
    return this.tokenService.getUserTokens(userId);
  }

  @MessagePattern('token.generateTokens')
  async generateTokens(
    @Payload() { id, isVerified, role }: AccessTokenPayload,
  ) {
    return this.tokenService.generateTokens(
      id,
      role as unknown as PrismaRole,
      isVerified,
    );
  }

  @MessagePattern('token.deleteToken')
  async deleteToken(@Payload() token: string) {
    return this.tokenService.deleteToken(token);
  }

  @MessagePattern('token.deleteAllUserTokens')
  async deleteAllUserTokens(@Payload() userId: number) {
    return this.tokenService.deleteAllUserTokens(userId);
  }

  @MessagePattern('token.update')
  async update(
    @Payload()
    {
      id,
      isVerified,
      oldToken,
      role,
    }: AccessTokenPayload & { oldToken: string },
  ) {
    return this.tokenService.update(
      id,
      role as unknown as PrismaRole,
      isVerified,
      oldToken,
    );
  }
}
