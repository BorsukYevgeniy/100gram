import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class MailService {
  private readonly APP_URL: string;
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.APP_URL === configService.APP_URL;
  }

  async sendVerificationMail(to: string, verificationLink: string) {
    return await this.mailerService.sendMail({
      to,
      subject: 'Verification mail on ' + this.APP_URL,
      html: `
      <div>
        <h1>For verification go to</h1>
        <a href="${verificationLink}">${verificationLink}</a>
      </div>
      `,
    });
  }
}
