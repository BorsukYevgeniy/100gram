import { AccessTokenPayload } from '@app/contracts/auth';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @MessagePattern()
  async verifyAccessToken(@Payload() token: string) {
    return this.tokenService.verifyAccessToken(token);
  }

  @MessagePattern()
  async verifyRefreshToken(@Payload() token: string) {
    return this.tokenService.verifyRefreshToken(token);
  }

  @MessagePattern()
  async getUserTokens(@Payload() userId: number) {
    return this.tokenService.getUserTokens(userId);
  }

  @MessagePattern()
  async generateTokens(
    @Payload() { id, isVerified, role }: AccessTokenPayload,
  ) {
    return this.tokenService.generateTokens(id, role, isVerified);
  }

  @MessagePattern()
  async deleteToken(@Payload() token: string) {
    return this.tokenService.deleteToken(token);
  }

  @MessagePattern()
  async deleteAllUserTokens(@Payload() userId: number) {
    return this.tokenService.deleteAllUserTokens(userId);
  }

  @MessagePattern()
  async update(
    @Payload()
    {
      id,
      isVerified,
      oldToken,
      role,
    }: AccessTokenPayload & { oldToken: string },
  ) {
    return this.tokenService.update(id, role, isVerified, oldToken);
  }
}
