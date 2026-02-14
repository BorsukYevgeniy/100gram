import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(dto);

    this.logger.info('User created', { userId: user.id, provider: 'local' });

    return user;
  }

  async createGoogleUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.createGoogleUser(dto);

    this.logger.info('User created', { userId: user.id, provider: 'google' });
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: number): Promise<User> {
    const user: User | null = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn("User doesn't exist", {
        userId: id,
      });
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assignAdmin(id: number): Promise<UserNoCredVCode> {
    try {
      const admin = await this.userRepository.assingAdmin(id);

      this.logger.info('User assigned as admin successfully', {
        userId: id,
      });

      return admin;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn("User doesn't exist", {
          userId: id,
        });
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async delete(
    user: AccessTokenPayload,
    userId: number,
  ): Promise<UserNoCredVCode> {
    const { chatsOwned } =
      await this.userRepository.findChatsWhereUserIsOwner(userId);

    if (!chatsOwned || chatsOwned.length === 0) {
      // Delete user if he dont have chats where he is owner
      const user = await this.userRepository.delete(userId);

      this.logger.info('User deleted', { userId: user.id });
      return user;
    }

    // Find new owner for every chat where user is owner
    for (const chat of chatsOwned) {
      const newOwnerId = await this.chatService.getNewOwnerId(chat.id, user.id);

      // If owner found update owner in chat else delete chat
      if (newOwnerId) {
        await this.chatService.updateOwner(chat.id, newOwnerId);
      } else await this.chatService.delete(user, chat.id);
    }

    const deletedUser = await this.userRepository.delete(userId);

    this.logger.info('User deleted', { userId: user.id });
    return deletedUser;
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    return this.userRepository.getUserByVerificationCode(verificationCode);
  }

  async verify(verificationLink: string): Promise<UserNoCredVCode> {
    const user = await this.userRepository.verify(verificationLink);

    this.logger.info('User verified', { userId: user.id });
    return user;
  }

  async deleteUnverifiedUsers(): Promise<number> {
    const { count } = await this.userRepository.deleteUnverifiedUsers();

    this.logger.info('Deleted unverified users', { count });
    return count;
  }

  async addOtpToUser(userId: number, otpHash: string, otpExpiresAt: Date) {
    await this.userRepository.addOtpToUser(userId, otpHash, otpExpiresAt);
    this.logger.info({ userId }, 'OTP added to user');
  }

  async incrementOtpAttempts(userId: number) {
    await this.userRepository.incrementOtpAttempts(userId);
    this.logger.info({ userId }, 'Incremented OTP attempts');
  }

  async resetPasswordWithOtp(userId: number, newPassword: string) {
    await this.userRepository.updatePassword(userId, newPassword);
    this.logger.info({ userId }, 'Password reseted');
  }
}
