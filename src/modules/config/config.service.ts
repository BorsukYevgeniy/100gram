import { MailerOptions } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';
import { ThrottlerOptions } from '@nestjs/throttler';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get GOOGLE_CONFIG() {
    return {
      clientID: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.getOrThrow<string>(
        'GOOGLE_CLIENT_SECRET',
      ),
      callbackURL: this.configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    };
  }

  get THROTTLE_CONFIG(): ThrottlerOptions {
    return {
      ttl: this.configService.getOrThrow<number>('THROTTLE_TTL'),
      limit: this.configService.getOrThrow<number>('THROTTLE_LIMIT'),
    };
  }

  get REFRESH_TOKEN_CONFIG(): JwtSignOptions {
    return {
      secret: this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),

      expiresIn: this.configService.getOrThrow<string>(
        'REFRESH_TOKEN_EXPIRATION_TIME',
      ),
    } as JwtSignOptions;
  }

  get ACCESS_TOKEN_CONFIG(): JwtSignOptions {
    return {
      secret: this.configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),

      expiresIn: this.configService.getOrThrow<string>(
        'ACCESS_TOKEN_EXPIRATION_TIME',
      ),
    } as JwtSignOptions;
  }

  get MAILER_CONFIG(): MailerOptions {
    return {
      transport: {
        host: this.configService.getOrThrow<string>('SMTP_HOST'),
      },
      defaults: {
        auth: {
          user: this.configService.getOrThrow<string>('SMTP_USER'),
          pass: this.configService.getOrThrow<string>('SMTP_PASSWORD'),
        },
      },
    };
  }

  get APP_URL(): string {
    return this.configService.getOrThrow<string>('APP_URL');
  }

  get DATABASE_URL(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get PORT(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get PASSWORD_SALT(): number {
    return Number(this.configService.getOrThrow<number>('PASSWORD_SALT'));
  }
}
