import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat } from '../../../generated/prisma/client';
import { UserService } from '../user/user.service';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userService: UserService,
  ) {}

  private async validateUsers(userIds: number[]) {
    return await Promise.all(
      userIds.map((id) => this.userService.findById(id)),
    );
  }

  async createPrivateChat(userId: number, createChatDto: CreatePrivateChatDto) {
    if (userId === createChatDto.userId)
      throw new BadRequestException('Cannot create private chat with yourself');

    await this.validateUsers([userId, createChatDto.userId]);

    return await this.chatRepository.createPrivateChat(
      userId,
      createChatDto.userId,
    );
  }

  async createGroupChat(dto: CreateGroupChatDto) {
    await this.validateUsers(dto.userIds);

    return await this.chatRepository.createGroupChat(dto);
  }

  async findById(id: number) {
    const chat: Chat | null = await this.chatRepository.getById(id);

    if (!chat) throw new NotFoundException('Chat not found');

    return chat;
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto) {
    try {
      return await this.chatRepository.updateGroupChat(id, dto);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new NotFoundException('Chat not found');
      throw e;
    }
  }

  async delete(id: number) {
    try {
      return await this.chatRepository.delete(id);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new NotFoundException('Chat not found');
      throw e;
    }
  }
}
