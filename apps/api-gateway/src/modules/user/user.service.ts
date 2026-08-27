import { CreateUserDto } from '@app/contracts/user/dto';
import { UserPattern } from '@app/contracts/user/pattern';
import {
  AddOtpToUserPayload,
  ResetPasswordPayload,
} from '@app/contracts/user/payload';
import { User, UserNoCredOtpVCode } from '@app/contracts/user/types';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, Observable, throwError } from 'rxjs';
import { USER_CLIENT } from './user.constant';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  getById(userId: number): Observable<UserNoCredOtpVCode> {
    return this.userClient
      .send<UserNoCredOtpVCode, number>(UserPattern.GET_BY_ID, userId)
      .pipe(catchError((e) => throwError(() => new RpcException(e.response))));
  }

  assignAdmin(userId: number): Observable<UserNoCredOtpVCode> {
    return this.userClient
      .send<UserNoCredOtpVCode, number>(UserPattern.ASSIGN_ADMIN, userId)
      .pipe(catchError((e) => throwError(() => new RpcException(e.response))));
  }

  delete(userId: number): Observable<UserNoCredOtpVCode> {
    return this.userClient
      .send<UserNoCredOtpVCode, number>(UserPattern.DELETE, userId)
      .pipe(catchError((e) => throwError(() => new RpcException(e.response))));
  }

  async create(dto: CreateUserDto): Promise<User> {
    return firstValueFrom(
      this.userClient
        .send<User, CreateUserDto>(UserPattern.CREATE, dto)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async findByEmail(email: string): Promise<User> {
    return firstValueFrom(
      this.userClient
        .send<User, string>(UserPattern.FIND_BY_EMAIL, email)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async findFullUserById(id: number): Promise<User> {
    return firstValueFrom(
      this.userClient
        .send<User, number>(UserPattern.FIND_FULL_USER_BY_ID, id)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    return firstValueFrom(
      this.userClient
        .send<
          User,
          string
        >(UserPattern.GET_BY_VERIFICATION_CODE, verificationCode)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }
  async verify(verificationCode: string): Promise<UserNoCredOtpVCode> {
    return firstValueFrom(
      this.userClient
        .send<UserNoCredOtpVCode, string>(UserPattern.VERIFY, verificationCode)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async createGoogleUser(dto: CreateUserDto): Promise<User> {
    return firstValueFrom(
      this.userClient
        .send<User, CreateUserDto>(UserPattern.CREATE_GOOGLE_USER, dto)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async addOtpToUser(
    userId: number,
    otpHash: string,
    otpExpiresAt: Date,
  ): Promise<void> {
    return firstValueFrom(
      this.userClient
        .send<
          void,
          AddOtpToUserPayload
        >(UserPattern.ADD_OTP_TO_USER, { userId, otpHash, otpExpiresAt })
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async incrementOtpAttempts(userId: number): Promise<void> {
    return firstValueFrom(
      this.userClient
        .send<void, number>(UserPattern.INCREMENT_OTP_ATTEMPTS, userId)
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }

  async resetPasswordWithOtp(
    userId: number,
    newPassword: string,
  ): Promise<void> {
    return firstValueFrom(
      this.userClient
        .send<void, ResetPasswordPayload>(UserPattern.RESET_PASSWORD_WITH_OTP, {
          userId,
          newPassword,
        })
        .pipe(
          catchError((e) => throwError(() => new RpcException(e.response))),
        ),
    );
  }
}
