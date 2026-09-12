import { Controller } from '@nestjs/common';
import { UserService } from './user.service';

import { CreateUserDto } from '@app/contracts/user/dto';
import { UserPattern } from '@app/contracts/user/pattern';
import {
  AddOtpToUserPayload,
  ResetPasswordPayload,
} from '@app/contracts/user/payload';
import { UserNoCredOtpVCode } from '@app/contracts/user/types';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UpdateAvatarPayload } from '../../../../../libs/contracts/src/user/payload/update-avatar.payload';
import { User } from '../../../generated/prisma/browser';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(UserPattern.GET_BY_ID)
  async getById(@Payload() userId: number): Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  @MessagePattern(UserPattern.ASSIGN_ADMIN)
  async assignAdmin(@Payload() userId: number): Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  @MessagePattern(UserPattern.CREATE)
  async create(@Payload() dto: CreateUserDto): Promise<User> {
    return this.userService.create(dto);
  }

  @MessagePattern(UserPattern.FIND_BY_EMAIL)
  async findByEmail(@Payload() email: string): Promise<User> {
    return this.userService.findByEmail(email);
  }

  @MessagePattern(UserPattern.FIND_FULL_USER_BY_ID)
  async findFullUserById(@Payload() id: number): Promise<User> {
    return this.userService.findFullUserById(id);
  }

  @MessagePattern(UserPattern.VERIFY)
  async verify(
    @Payload() verificationCode: string,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.verify(verificationCode);
  }

  @MessagePattern(UserPattern.GET_BY_VERIFICATION_CODE)
  async getUserByVerificationCode(
    @Payload() verificationCode: string,
  ): Promise<User> {
    return this.userService.getUserByVerificationCode(verificationCode);
  }

  @MessagePattern(UserPattern.CREATE_GOOGLE_USER)
  async createGoogleUser(@Payload() dto: CreateUserDto): Promise<User> {
    return this.userService.createGoogleUser(dto);
  }

  @MessagePattern(UserPattern.UPDATE_AVATAR)
  async updateAvatar(
    @Payload() { userId, newAvatarName }: UpdateAvatarPayload,
  ): Promise<UserNoCredOtpVCode> {
    return this.userService.updateAvatar(userId, newAvatarName);
  }

  @MessagePattern(UserPattern.ADD_OTP_TO_USER)
  async addOtpToUser(
    @Payload()
    { otpExpiresAt, otpHash, userId }: AddOtpToUserPayload,
  ) {
    return this.userService.addOtpToUser(userId, otpHash, otpExpiresAt);
  }

  @MessagePattern(UserPattern.INCREMENT_OTP_ATTEMPTS)
  async incrementOtpAttempts(@Payload() userId: number) {
    return this.userService.incrementOtpAttempts(userId);
  }

  @MessagePattern(UserPattern.RESET_PASSWORD_WITH_OTP)
  async resetPasswordWithOtp(
    @Payload() { newPassword, userId }: ResetPasswordPayload,
  ) {
    return this.userService.resetPasswordWithOtp(userId, newPassword);
  }

  @MessagePattern(UserPattern.DELETE)
  async delete(@Payload() userId: number): Promise<UserNoCredOtpVCode> {
    return this.userService.delete(userId);
  }

  // @Delete('me')
  // async deleteMe(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, user.id);
  // }

  // @Delete(':userId')
  // async deleteUserById(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  //   @Param('userId') userId: number,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, userId);
  // }
}
