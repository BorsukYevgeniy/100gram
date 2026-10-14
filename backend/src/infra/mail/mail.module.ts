import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigType } from '@nestjs/config';
import smtpConfig from '../../config/smtp.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(smtpConfig)],
      inject: [smtpConfig.KEY],
      useFactory: (c: ConfigType<typeof smtpConfig>) => c,
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
