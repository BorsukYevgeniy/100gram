import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserToken(userId: number) {
    return await this.prisma.token.findMany({
      where: { userId },
    });
  }

  async create(userId: number, token: string, expiresAt: Date) {
    return await this.prisma.token.create({
      data: { expiresAt, userId, token },
    });
  }

  async update(oldToken: string, newToken: string, newExpiresAt: Date) {
    return await this.prisma.token.update({
      where: { token: oldToken },
      data: { token: newToken, expiresAt: newExpiresAt },
    });
  }

  async delete(token: string) {
    return await this.prisma.token.delete({
      where: {
        token,
      },
    });
  }

  async deleteAllUserToken(userId: number) {
    return await this.prisma.token.deleteMany({
      where: {
        userId,
      },
    });
  }
}
