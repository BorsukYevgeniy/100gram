import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { User } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { ChatService } from '../chat/chat.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserNoCredVCode } from './types/user.types';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly chatService: ChatService,
  ) {}

  async create(dto: CreateUserDto) {
    const user = await this.userRepository.create(dto);

    this.logger.log(`User ${user.id} created successfully by local provider`);
    return user;
  }

  async createGoogleUser(dto: CreateUserDto) {
    const user = await this.userRepository.createGoogleUser(dto);

    this.logger.log(`User ${user.id} created successfully by google provider`);
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.userRepository.findByEmail(email);

    this.logger.log(`User ${user.id} fethed successfully by email`);
    return user;
  }

  async findById(id: number) {
    const user: User | null = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User ${user.id} doesn't exist`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User ${user.id} fetched successfully`);
    return user;
  }

  async assignAdmin(id: number) {
    try {
      const admin = await this.userRepository.assingAdmin(id);

      this.logger.log(`User ${admin.id} assigned as admin successfully`);
      return admin;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn(`User ${id} doesn't exist`);
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async delete(user: AccessTokenPayload, userId: number) {
    const { chatsOwned } =
      await this.userRepository.getChatsWhereUserIsOwner(userId);

    this.logger.log(`Chat where user ${userId} is owner fetched successfully`);

    if (!chatsOwned || chatsOwned.length === 0) {
      const user = await this.userRepository.delete(userId);
      this.logger.log(`User ${user.id} deleted successfully`);
      return user;
    }

    for (const chat of chatsOwned) {
      const newOwnerId = await this.chatService.getNewOwnerId(chat.id, user.id);

      if (newOwnerId) {
        await this.chatService.updateOwner(chat.id, newOwnerId);
      } else await this.chatService.delete(user, chat.id);
    }

    const deletedUser = await this.userRepository.delete(userId);

    this.logger.log(`User ${deletedUser.id} deleted successfully`);
    return deletedUser;
  }

  async getUserByVerificationCode(verificationCode: string) {
    const user =
      await this.userRepository.getUserByVerificationCode(verificationCode);

    this.logger.log(`User ${user.id} fethed successfully by verification code`);
    return user;
  }

  async verify(verificationLink: string): Promise<UserNoCredVCode> {
    const user = await this.userRepository.verify(verificationLink);

    this.logger.log(`User ${user.id} verified succesfully`);
    return user;
  }

  async deleteUnverifiedUsers() {
    const { count } = await this.userRepository.deleteUnverifiedUsers();
    this.logger.log(`Deleted ${count} unverified users`);
    return count;
  }
}
