import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { User } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { ChatService } from '../chat/chat.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserNoCredVCode } from './types/user.types';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly chatService: ChatService,
  ) {}

  async create(dto: CreateUserDto) {
    return await this.userRepository.create(dto);
  }

  async createGoogleUser(dto: CreateUserDto) {
    return await this.userRepository.createGoogleUser(dto);
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

  async delete(user: AccessTokenPayload, userId: number) {
    const { chatsOwned } =
      await this.userRepository.getChatsWhereUserIsOwner(userId);

    if (!chatsOwned || chatsOwned.length === 0) {
      return await this.userRepository.delete(userId);
    }

    for (const chat of chatsOwned) {
      const { userId: newOwnerId } = await this.chatService.getNewOwnerId(
        chat.id,
        user.id,
      );

      if (newOwnerId) {
        await this.chatService.updateOwner(chat.id, newOwnerId);
      } else await this.chatService.delete(chat.id);
    }

    return await this.userRepository.delete(userId);
  }

  async getUserByVerificationCode(verificationCode: string) {
    return await this.userRepository.getUserByVerificationCode(
      verificationCode,
    );
  }

  async verify(verificationLink: string): Promise<UserNoCredVCode> {
    return await this.userRepository.verify(verificationLink);
  }

  async deleteUnverifiedUsers() {
    return await this.userRepository.deleteUnverifiedUsers();
  }
}
