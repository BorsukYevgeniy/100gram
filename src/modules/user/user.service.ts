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

  create(dto: CreateUserDto) {
    return this.userRepository.create(dto);
  }

  createGoogleUser(dto: CreateUserDto) {
    return this.userRepository.createGoogleUser(dto);
  }

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: number) {
    const user: User | null = await this.userRepository.findById(id);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  assignAdmin(id: number) {
    try {
      return this.userRepository.assingAdmin(id);
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
      } else await this.chatService.delete(user, chat.id);
    }

    return await this.userRepository.delete(userId);
  }

  getUserByVerificationCode(verificationCode: string) {
    return this.userRepository.getUserByVerificationCode(verificationCode);
  }

  verify(verificationLink: string): Promise<UserNoCredVCode> {
    return this.userRepository.verify(verificationLink);
  }

  deleteUnverifiedUsers() {
    return this.userRepository.deleteUnverifiedUsers();
  }
}
