import { Injectable } from '@nestjs/common';
import { Role, User } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserNoCredOtpVCode } from './types/user.types';

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
      data: { ...dto, isVerified: true, verifiedAt: new Date() },
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

  async assingAdmin(id: number): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.update({
      where: { id },
      data: { role: Role.ADMIN },
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

  async findChatsWhereUserIsOwner(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        chatsOwned: { select: { id: true, ownerId: true, chatType: true } },
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
    avatar?: string,
  ): Promise<UserNoCredOtpVCode> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar },
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

  async addOtpToUser(userId: number, otpHash: string, otpExpiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
      },
      select: {},
    });
  }

  async incrementOtpAttempts(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        otpAttempts: { increment: 1 },
      },
      select: {},
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
}
