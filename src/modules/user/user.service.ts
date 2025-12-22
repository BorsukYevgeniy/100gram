import { Injectable, NotFoundException } from '@nestjs/common';
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
}
