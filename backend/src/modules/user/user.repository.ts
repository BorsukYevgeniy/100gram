import { Injectable } from '@nestjs/common';
import { Role, User } from '../../../generated/prisma/client';
import { Provider } from '../../../generated/prisma/enums';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PublicUserProfile, UserNoCredOtpVCode } from './types/user.types';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(userId: number): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.delete({
      where: { id: userId },
      omit: {
        email: true,
        verificationCode: true,
        password: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data: dto });
  }

  async createGoogleUser(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...dto,
        isVerified: true,
        verifiedAt: new Date(),
        provider: Provider.GOOGLE,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findFullUserById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findById(id: number): Promise<UserNoCredOtpVCode | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: {
        email: true,
        password: true,
        verificationCode: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async findPublicProfileById(id: number): Promise<PublicUserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        description: true,
        avatarName: true,
        createdAt: true,
      },
    });
  }

  async updateUserRole(id: number, role: Role): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      omit: {
        email: true,
        verificationCode: true,
        password: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { verificationCode } });
  }

  async verify(verificationCode: string): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.update({
      where: { verificationCode },
      data: { isVerified: true, verifiedAt: new Date() },
      omit: {
        email: true,
        password: true,
        verificationCode: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async deleteUnverifiedUsers() {
    const deletingDate = new Date();
    deletingDate.setDate(deletingDate.getDate() - 3);

    return this.prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: {
          lte: deletingDate,
        },
      },
    });
  }

  async updateAvatar(
    userId: number,
    avatar: string,
  ): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: {
          connect: { name: avatar },
        },
      },
      omit: {
        email: true,
        password: true,
        verificationCode: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async deleteAvatar(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: {
          disconnect: true,
        },
      },
    });
  }

  async addOtpToUser(userId: number, otpHash: string, otpExpiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
      },
    });
  }

  async incrementOtpAttempts(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        otpAttempts: { increment: 1 },
      },
    });
  }

  async updatePassword(userId: number, newPassword: string) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newPassword,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: null,
      },
    });
  }

  async updateUserProfile(userId: number, dto: UpdateUserProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: {
        email: true,
        password: true,
        verificationCode: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }

  async searchUser(dto: SearchUserDto, take: number, cursor?: number) {
    return this.prisma.user.findMany({
      where: {
        nickname: { contains: dto.nickname },
      },
      take,

      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),

      orderBy: {
        id: 'desc',
      },
      omit: {
        email: true,
        password: true,
        verificationCode: true,
        otpHash: true,
        otpExpiresAt: true,
        otpAttempts: true,
      },
    });
  }
}
