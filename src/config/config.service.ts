import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get DATABASE_URL() {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get PORT() {
    return this.configService.getOrThrow<number>('PORT');
  }
}
