import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          transport: {
            host: configService.SMTP_HOST,
          },
          defaults: {
            auth: {
              user: configService.SMTP_USER,
              pass: configService.SMTP_PASSWORD,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
