import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerificationMail(to: string, verificationCode: string) {
    const link = this.configService.APP_URL.concat(
      '/auth/verify/',
      verificationCode,
    );

    await this.mailerService.sendMail({
      to,
      subject: 'Verification mail on ' + this.configService.APP_URL,
      html: `
      <div>
        <h1>For verification go to</h1>
        <a href="${link}">${link}</a>
      </div>
      `,
    });

    this.logger.log(`Verification mail sended successfully to ${to}`);
  }
}
