import { CreateUserDto } from '@app/contracts/user';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import { USER_CLIENT } from './user.constant';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  getUserById(userId) {
    return this.userClient
      .send('user.getById', userId)
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }

  getMe(user) {
    return this.userClient
      .send('user.getById', user)
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }

  assignAdmin(userId) {
    return this.userClient
      .send('user.assignAdmin', userId)
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response)),
        ),
      );
  }

  async create(dto: CreateUserDto) {
    return firstValueFrom(
      this.userClient
        .send('user.create', dto)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async findByEmail(email: string) {
    return firstValueFrom(
      this.userClient
        .send('user.findByEmail', email)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async findFullUserById(id: number) {
    return firstValueFrom(
      this.userClient
        .send('user.findFullUserById', id)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async getUserByVerificationCode(verificationCode: string) {
    return firstValueFrom(
      this.userClient
        .send('user.getUserByVerificationCode', verificationCode)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }
  async verify(verificationCode: string) {
    return firstValueFrom(
      this.userClient
        .send('user.verify', verificationCode)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async createGoogleUser(dto: CreateUserDto) {
    return firstValueFrom(
      this.userClient
        .send('user.createGoogleUser', dto)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async addOtpToUser(userId: number, otpHash: string, otpExpiresAt: Date) {
    return firstValueFrom(
      this.userClient
        .send('user.addOtpToUser', { userId, otpHash, otpExpiresAt })
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async incrementOtpAttempts(userId: number) {
    return firstValueFrom(
      this.userClient
        .send('user.incrementOtpAttempts', userId)
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }

  async resetPasswordWithOtp(userId: number, newPassword: string) {
    return firstValueFrom(
      this.userClient
        .send('user.resetPasswordWithOtp', { userId, newPassword })
        .pipe(
          catchError((error) =>
            throwError(() => new RpcException(error.response)),
          ),
        ),
    );
  }
}
