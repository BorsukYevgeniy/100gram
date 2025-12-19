import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class BaseConfigService {
  constructor(protected readonly configService: NestConfigService) {}

  get DATABASE_URL() {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }
}
