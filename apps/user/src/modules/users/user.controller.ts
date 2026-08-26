import { Controller } from '@nestjs/common';
// import { RequiredRoles } from '../auth/decorator/required-roles.decorator';
// import { AuthGuard } from '../auth/guards/auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { UserService } from './user.service';

// import { UserNoCredOtpVCode } from '../../../../users/src/modules/users/types/user.types';
import { UserService } from './user.service';
// import { CurrentUser } from '../../common/decorators/routes/user.decorator';

// import { ApiUserControllerDocs, ApiUserRoutesDocs } from './docs';

// @ApiUserControllerDocs()

import { CreateUserDto } from '@app/contracts/user';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @ApiUserRoutesDocs.GetById()
  // @UseGuards(AuthGuard)
  @MessagePattern('user.getById')
  async getById(@Payload() userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.findById(userId);
  }

  // @ApiUserRoutesDocs.GetMe()
  // @UseGuards(AuthGuard)
  @MessagePattern('user.getMe')
  async getMe(
    // @CurrentUser() user: AccessTokenPayload,
    user,
  ) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.findById(user.id);
  }

  // @ApiUserRoutesDocs.AssignAdmin()
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  @MessagePattern('user.assignAdmin')
  async assignAdmin(@Payload() userId: number) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.assignAdmin(userId);
  }

  @MessagePattern('user.create')
  async create(@Payload() dto: CreateUserDto) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.create(dto);
  }

  @MessagePattern('user.findByEmail')
  async findByEmail(@Payload() email: string) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.findByEmail(email);
  }

  @MessagePattern('user.findFullUserById')
  async findFullUserById(@Payload() id: number) {
    return this.userService.findFullUserById(id);
  }

  @MessagePattern('user.verify')
  async verify(@Payload() verificationCode: string) {
    //: Promise<UserNoCredOtpVCode> {
    return this.userService.verify(verificationCode);
  }

  @MessagePattern('user.getUserByVerificationCode')
  async getUserByVerificationCode(@Payload() verificationCode: string) {
    return this.userService.getUserByVerificationCode(verificationCode);
  }

  @MessagePattern('user.createGoogleUser')
  async createGoogleUser(@Payload() dto: CreateUserDto) {
    return this.userService.createGoogleUser(dto);
  }

  @MessagePattern('user.addOtpToUser')
  async addOtpToUser(
    @Payload()
    {
      otpExpiresAt,
      otpHash,
      userId,
    }: {
      userId: number;
      otpHash: string;
      otpExpiresAt: Date;
    },
  ) {
    return this.userService.addOtpToUser(userId, otpHash, otpExpiresAt);
  }

  @MessagePattern('user.incrementOtpAttempts')
  async incrementOtpAttempts(@Payload() userId: number) {
    return this.userService.incrementOtpAttempts(userId);
  }

  @MessagePattern('user.resetPasswordWithOtp')
  async resetPasswordWithOtp(
    @Payload() { newPassword, userId }: { userId: number; newPassword: string },
  ) {
    return this.userService.resetPasswordWithOtp(userId, newPassword);
  }

  // @ApiUserRoutesDocs.DeleteMe()
  // @UseGuards(AuthGuard)
  // @Delete('me')
  // async deleteMe(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, user.id);
  // }

  // @ApiUserRoutesDocs.DeleteUser()
  // @RequiredRoles([Role.ADMIN])
  // @UseGuards(RolesGuard)
  // @Delete(':userId')
  // async deleteUserById(
  // @CurrentUser() user: AccessTokenPayload,
  //   user,
  //   @Param('userId') userId: number,
  // ): Promise<UserNoCredOtpVCode> {
  //   return this.userService.delete(user, userId);
  // }
}
