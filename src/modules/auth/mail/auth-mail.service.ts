import { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import appConfig from '../../../config/app.config';
import { MailService } from '../../../infra/mail/mail.service';
export class AuthMailService {
  constructor(
    private readonly mailService: MailService,
    private readonly appConf: ConfigType<typeof appConfig>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthMailService.name);
  }

  async sendVerificationMail(to: string, verificationCode: string) {
    const link = this.appConf.appUrl.concat('/auth/verify/', verificationCode);

    await this.mailService.sendMail(
      to,
      'Verification mail on' + this.appConf.appUrl,
      `
      <div>
        <h1>For verification go to</h1>
        <a href="${link}">${link}</a>
      </div>
      `,
    );

    this.logger.info({ to }, 'Verification mail sended successfully');
  }

  async sendOtpMail(to: string, otp: number) {
    await this.mailService.sendMail(
      to,
      'Password reseting on' + this.appConf.appUrl,
      `
      <div>
        <h1>Your OTP code for password reseting</h1>
        <p>${otp}</p>
      </div>
      `,
    );

    this.logger.info({ to }, 'OTP mail sended successfully');
  }
}
