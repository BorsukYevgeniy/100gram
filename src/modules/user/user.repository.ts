import { Injectable } from '@nestjs/common';
import { Role, User } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(userId: number): Promise<User> {
    return await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return await this.prisma.user.create({ data: dto });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async assingAdmin(id: number): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: { role: Role.ADMIN },
    });
  }

  async getChatsWhereUserIsOwner(userId: number) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        chatsOwned: { select: { id: true, ownerId: true, chatType: true } },
      },
    });
  }

  async getUserByVerificationLink(verificationLink: string) {
    return await this.prisma.user.findUnique({ where: { verificationLink } });
  }

  async verify(verificationLink: string) {
    return await this.prisma.user.update({
      where: { verificationLink },
      data: { isVerified: true, verifiedAt: new Date() },
    });
  }

  async deleteUnverifiedUsers() {
    const deletingDate = new Date();
    deletingDate.setDate(deletingDate.getDate() - 3);

    return await this.prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: {
          lte: deletingDate,
        },
      },
    });
  }
}
