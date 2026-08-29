import { CreateUserDto } from '@app/contracts/user/dto';
import { UserPattern } from '@app/contracts/user/pattern';
import {
  AddOtpToUserPayload,
  ResetPasswordPayload,
} from '@app/contracts/user/payload';
import { User, UserNoCredOtpVCode } from '@app/contracts/user/types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_CLIENT } from '../../common/client/user-client.constants';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: UserPattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.userClient.send<TOut, TIn>(pattern, input));
  }

  async getById(userId: number): Promise<UserNoCredOtpVCode> {
    return this.send<UserNoCredOtpVCode, number>(UserPattern.GET_BY_ID, userId);
  }

  async assignAdmin(userId: number): Promise<UserNoCredOtpVCode> {
    return this.send<UserNoCredOtpVCode, number>(
      UserPattern.ASSIGN_ADMIN,
      userId,
    );
  }

  async delete(userId: number): Promise<UserNoCredOtpVCode> {
    return this.send<UserNoCredOtpVCode, number>(UserPattern.DELETE, userId);
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.send<User, CreateUserDto>(UserPattern.CREATE, dto);
  }

  async findByEmail(email: string): Promise<User> {
    return this.send<User, string>(UserPattern.FIND_BY_EMAIL, email);
  }

  async findFullUserById(id: number): Promise<User> {
    return this.send<User, number>(UserPattern.FIND_FULL_USER_BY_ID, id);
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    return this.send<User, string>(
      UserPattern.GET_BY_VERIFICATION_CODE,
      verificationCode,
    );
  }

  async verify(verificationCode: string): Promise<UserNoCredOtpVCode> {
    return this.send<UserNoCredOtpVCode, string>(
      UserPattern.VERIFY,
      verificationCode,
    );
  }

  async createGoogleUser(dto: CreateUserDto): Promise<User> {
    return this.send<User, CreateUserDto>(UserPattern.CREATE_GOOGLE_USER, dto);
  }

  async addOtpToUser(
    userId: number,
    otpHash: string,
    otpExpiresAt: Date,
  ): Promise<void> {
    return this.send<void, AddOtpToUserPayload>(UserPattern.ADD_OTP_TO_USER, {
      userId,
      otpHash,
      otpExpiresAt,
    });
  }

  async incrementOtpAttempts(userId: number): Promise<void> {
    return this.send<void, number>(UserPattern.INCREMENT_OTP_ATTEMPTS, userId);
  }

  async resetPasswordWithOtp(
    userId: number,
    newPassword: string,
  ): Promise<void> {
    return this.send<void, ResetPasswordPayload>(
      UserPattern.RESET_PASSWORD_WITH_OTP,
      {
        userId,
        newPassword,
      },
    );
  }
}
