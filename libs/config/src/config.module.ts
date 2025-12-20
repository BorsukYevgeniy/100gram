import { ApiConfigService } from '@config';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { BaseConfigService } from './base-config.service';
import { apiValidationSchema } from './schemas/api-validation.schema';
import { baseValidationSchema } from './schemas/base-validation.schema';

@Module({})
export class ConfigModule {
  static forApi() {
    return {
      imports: [
        NestConfigModule.forRoot({
          envFilePath: ['.env', './apps/api/.env'],
          validationSchema: apiValidationSchema,
        }),
      ],
      module: ConfigModule,
      providers: [BaseConfigService, ApiConfigService],
      exports: [BaseConfigService, ApiConfigService],
    };
  }

  static forBase() {
    return {
      imports: [
        NestConfigModule.forRoot({
          envFilePath: '.env',
          validationSchema: baseValidationSchema,
        }),
      ],
      module: ConfigModule,
      providers: [BaseConfigService],
      exports: [BaseConfigService],
    };
  }
}
