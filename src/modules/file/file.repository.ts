import { Injectable } from '@nestjs/common';
import { FileType } from '../../../generated/prisma/enums';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFiles(fileNames: string[], fileType: FileType) {
    return this.prisma.$transaction(
      fileNames.map((name) =>
        this.prisma.file.create({
          data: { name, fileType },
        }),
      ),
    );
  }

  async deleteFiles(fileNames: string[]) {
    return this.prisma.$transaction(
      fileNames.map((name) =>
        this.prisma.file.delete({
          where: { name },
        }),
      ),
    );
  }

  async deleteUnusedFiles() {
    return this.prisma.file.deleteMany({
      where: {
        message: {
          is: null,
        },
        chatAvatar: {
          is: null,
        },
        userAvatar: {
          is: null,
        },
      },
    });
  }

  async findUnusedFiles() {
    return this.prisma.file.findMany({
      where: {
        message: {
          is: null,
        },
        chatAvatar: {
          is: null,
        },
        userAvatar: {
          is: null,
        },
      },
      select: { name: true, fileType: true },
    });
  }
}
