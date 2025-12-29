import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get DATABASE_URL(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get PORT(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get PASSWORD_SALT(): number {
    return Number(this.configService.getOrThrow<number>('PASSWORD_SALT'));
  }

  get ACCESS_TOKEN_SECRET(): string {
    return this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET');
  }

  get ACCESS_TOKEN_EXPIRATION_TIME(): string {
    return this.configService.getOrThrow<string>(
      'ACCESS_TOKEN_EXPIRATION_TIME',
    );
  }

  get REFRESH_TOKEN_SECRET(): string {
    return this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET');
  }

  get REFRESH_TOKEN_EXPIRATION_TIME(): string {
    return this.configService.getOrThrow<string>(
      'REFRESH_TOKEN_EXPIRATION_TIME',
    );
  }

  get GOOGLE_CONFIG() {
    return {
      clientID: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET',
      ),
      callbackURL: this.configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
    };
  }
}
