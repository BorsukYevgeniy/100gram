import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { ChatType, User } from '../../../generated/prisma/client';
import { ChatService } from '../chat/chat.service';
import { CreateUserDto } from './dto/create-user.dto';
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

  async delete(userId: number) {
    const chats = (await this.userRepository.getChatsWhereUserIsOwner(userId))
      .chatsOwned;

    if (!chats || chats.length === 0) {
      return await this.userRepository.delete(userId);
    }

    for (const chat of chats) {
      if (chat.chatType === ChatType.PRIVATE) {
        await this.chatService.delete(chat.id);
      } else {
        const participants = await this.chatService.getUserIdsInChat(chat.id);
        const newOwner = participants.find((u) => u.userId !== userId);

        if (newOwner) {
          await this.chatService.updateOwner(chat.id, newOwner.userId);
        }
      }
    }

    return await this.userRepository.delete(userId);
  }
}
