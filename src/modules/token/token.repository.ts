import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserToken(userId: number) {
    return this.prisma.token.findMany({
      where: { userId },
    });
  }

  async create(userId: number, token: string, expiresAt: Date) {
    return this.prisma.token.create({
      data: { expiresAt, userId, token },
    });
  }

  async update(oldToken: string, newToken: string, newExpiresAt: Date) {
    return this.prisma.token.update({
      where: { token: oldToken },
      data: { token: newToken, expiresAt: newExpiresAt },
    });
  }

  async delete(token: string) {
    return this.prisma.token.delete({
      where: {
        token,
      },
    });
  }

  async deleteAllUserToken(userId: number) {
    return this.prisma.token.deleteMany({
      where: {
        userId,
      },
    });
  }

  async deleteExpiredTokens() {
    return this.prisma.token.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
