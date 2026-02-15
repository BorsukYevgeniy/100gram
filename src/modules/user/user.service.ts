import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { ChatService } from '../chat/chat.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserNoCredOtpVCode } from './types/user.types';
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

    this.logger.info({ userId: user.id, provider: 'local' }, 'User created');
    return user;
  }

  async createGoogleUser(dto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.createGoogleUser(dto);

    this.logger.info(
      { userId: user.id, provider: 'google' },
      'User created via Google',
    );
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }

  async findFullUserById(id: number): Promise<User> {
    const user: User | null = await this.userRepository.findFullUserById(id);

    if (!user) {
      this.logger.warn({ userId: id }, "User doesn't exist");
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findById(id: number): Promise<UserNoCredOtpVCode> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn({ userId: id }, "User doesn't exist");
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async assignAdmin(id: number): Promise<UserNoCredOtpVCode> {
    try {
      const admin = await this.userRepository.assingAdmin(id);

      this.logger.info({ userId: id }, 'User assigned as admin successfully');
      return admin;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ userId: id }, "User doesn't exist");
        throw new NotFoundException('User not found');
      }
      throw e;
    }
  }

  async delete(
    user: AccessTokenPayload,
    userId: number,
  ): Promise<UserNoCredOtpVCode> {
    const { chatsOwned } =
      await this.userRepository.findChatsWhereUserIsOwner(userId);

    // Delete user if he dont have chats where he is owner
    if (!chatsOwned || chatsOwned.length === 0) {
      const deletedUser = await this.userRepository.delete(userId);
      this.logger.info(
        { userId: deletedUser.id },
        'User deleted (no owned chats)',
      );
      return deletedUser;
    }

    // Find new owner for every chat where user is owner
    for (const chat of chatsOwned) {
      const newOwnerId = await this.chatService.getNewOwnerId(chat.id, user.id);

      // If owner found update owner in chat else delete chat
      if (newOwnerId) {
        await this.chatService.updateOwner(chat.id, newOwnerId);
        this.logger.info(
          { chatId: chat.id, oldOwnerId: user.id, newOwnerId },
          'Updated chat owner before deleting user',
        );
      } else {
        await this.chatService.delete(user, chat.id);
        this.logger.info(
          { chatId: chat.id, oldOwnerId: user.id },
          'Deleted chat as no new owner found before deleting user',
        );
      }
    }

    const deletedUser = await this.userRepository.delete(userId);
    this.logger.info({ userId: deletedUser.id }, 'User deleted');
    return deletedUser;
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    return this.userRepository.getUserByVerificationCode(verificationCode);
  }

  async verify(verificationLink: string): Promise<UserNoCredOtpVCode> {
    const user = await this.userRepository.verify(verificationLink);

    this.logger.info({ userId: user.id }, 'User verified successfully');
    return user;
  }

  async deleteUnverifiedUsers(): Promise<number> {
    const { count } = await this.userRepository.deleteUnverifiedUsers();

    this.logger.info({ count }, 'Deleted unverified users');
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
