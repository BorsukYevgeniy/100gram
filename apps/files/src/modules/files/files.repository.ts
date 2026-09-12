import { Injectable } from '@nestjs/common';
import { CreateFileDto } from '../../../../../libs/contracts/src/files/dto/create-file.dto';
import { File } from '../../../generated/prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFile(name: string) {
    return this.prisma.file.findUnique({ where: { name } });
  }

  async create(name: string, dto: CreateFileDto): Promise<File> {
    return this.prisma.file.create({
      data: { ...dto, name },
    });
  }

  async delete(name: string): Promise<File> {
    return this.prisma.file.delete({
      where: {
        name,
      },
    });
  }
}
