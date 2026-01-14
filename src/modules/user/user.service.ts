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
    const user = await this.userRepository.findByEmail(email);

    return user;
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
      const user = await this.userRepository.delete(userId);

      this.logger.info('User deleted', { userId: user.id });
      return user;
    }

    for (const chat of chatsOwned) {
      const newOwnerId = await this.chatService.getNewOwnerId(chat.id, user.id);

      if (newOwnerId) {
        await this.chatService.updateOwner(chat.id, newOwnerId);
      } else await this.chatService.delete(user, chat.id);
    }

    const deletedUser = await this.userRepository.delete(userId);

    this.logger.info('User deleted', { userId: user.id });
    return deletedUser;
  }

  async getUserByVerificationCode(verificationCode: string): Promise<User> {
    const user =
      await this.userRepository.getUserByVerificationCode(verificationCode);

    return user;
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
}
