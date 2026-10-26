import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFiles(dtos: CreateFileDto[]) {
    return this.prisma.$transaction(
      dtos.map((dto) =>
        this.prisma.file.create({
          data: dto,
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
