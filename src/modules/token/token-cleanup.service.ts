import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TokenService } from './token.service';

@Injectable()
export class TokenCleanupService {
  constructor(private readonly tokenService: TokenService) {}

  @Cron('0 0 */7 * *')
  async deleteExpiredTokens() {
    return this.tokenService.deleteExpiredTokens();
  }
}
