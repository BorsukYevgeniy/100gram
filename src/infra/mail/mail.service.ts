import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import appConfig from '../../config/app.config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MailService.name);
  }

  async sendVerificationMail(to: string, verificationCode: string) {
    const link = this.appConf.appUrl.concat('/auth/verify/', verificationCode);

    await this.mailerService.sendMail({
      to,
      subject: 'Verification mail on ' + this.appConf.appUrl,
      html: `
      <div>
        <h1>For verification go to</h1>
        <a href="${link}">${link}</a>
      </div>
      `,
    });

    this.logger.info({ to }, 'Verification mail sended successfully');
  }

  async sendOtpMail(to: string, otp: number) {
    await this.mailerService.sendMail({
      to,
      subject: 'Password reseting on ' + this.appConf.appUrl,
      html: `
      <div>
        <h1>Your OTP code for password reseting</h1>
        <p>${otp}</p>
      </div>
      `,
    });

    this.logger.info({ to }, 'OTP mail sended successfully');
  }
}
