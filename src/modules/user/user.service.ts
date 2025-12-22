import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { User } from '../../../generated/prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserDto) {
    return await this.userRepository.create(dto);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findById(id: number) {
    const user: User | null = await this.userRepository.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async assignAdmin(id: number) {
    try {
      return await this.userRepository.assingAdmin(id);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new NotFoundException('User not found');
      throw e;
    }
  }
}
