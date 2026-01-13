import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFiles(fileNames: string[], userId: number, messageId?: number) {
    return this.prisma.$transaction(
      fileNames.map((name) =>
        this.prisma.file.create({ data: { name, userId, messageId } }),
      ),
    );
  }

  async deleteUnusedFiles() {
    return this.prisma.file.deleteMany({
      where: {
        OR: [
          {
            messageId: null,
          },
          { userId: null },
        ],
      },
    });
  }

  async findUnusedFiles() {
    return this.prisma.file.findMany({
      where: {
        OR: [
          {
            messageId: null,
          },
          { userId: null },
        ],
      },
    });
  }
}
