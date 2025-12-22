import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat, Role } from '../../../generated/prisma/client';
import { JwtPayload } from '../../common/interfaces';
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

  private async validateChatParticipation(user: JwtPayload, chatId: number) {
    if (user.role === Role.ADMIN) return;

    const usersInChat = await this.chatRepository.getUserIdsInChat(chatId);

    const isParticipant = usersInChat.some((u) => u.userId === user.id);

    if (!isParticipant)
      throw new ForbiddenException('User is not a participant of the chat');
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

  async findById(user: JwtPayload, chatId: number) {
    await this.validateChatParticipation(user, chatId);

    const chat: Chat | null = await this.chatRepository.getById(chatId);

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
