import { Module } from '@nestjs/common';

import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { validationSchema } from './schemas/validation.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      validationSchema: validationSchema,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
