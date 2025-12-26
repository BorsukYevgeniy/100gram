import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat, ChatType, Role, User } from '../../../generated/prisma/client';
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

  private async validateChatType(chatId: number, expectedType: ChatType) {
    const chat = await this.chatRepository.getById(chatId);

    if (chat.chatType !== expectedType)
      throw new BadRequestException(`Chat is not of type ${expectedType}`);
  }

  private async validateUsers(userIds: number[]): Promise<User[]> {
    return await Promise.all(
      userIds.map((id) => this.userService.findById(id)),
    );

    // If any user is not found, userService.findById will throw NotFoundException
  }

  private async validateChatParticipation(
    user: JwtPayload,
    chatId: number,
  ): Promise<void> {
    await this.chatRepository.getById(chatId);

    if (user.role === Role.ADMIN) return;

    const usersInChat = await this.chatRepository.getUserIdsInChat(chatId);

    const isParticipant = usersInChat.some((u) => u.userId === user.id);

    if (!isParticipant)
      throw new ForbiddenException('User is not a participant of the chat');
  }

  async createPrivateChat(
    userId: number,
    createChatDto: CreatePrivateChatDto,
  ): Promise<Chat> {
    await this.validateUsers([userId, createChatDto.userId]);

    if (userId === createChatDto.userId)
      throw new BadRequestException('Cannot create private chat with yourself');

    return await this.chatRepository.createPrivateChat(
      userId,
      createChatDto.userId,
    );
  }

  async createGroupChat(dto: CreateGroupChatDto): Promise<Chat> {
    await this.validateUsers(dto.userIds);

    return await this.chatRepository.createGroupChat(dto);
  }

  async findById(user: JwtPayload, chatId: number): Promise<Chat> {
    await this.validateChatParticipation(user, chatId);

    const chat: Chat | null = await this.chatRepository.getById(chatId);

    return chat;
  }

  async updateGroupChat(id: number, dto: UpdateGroupChatDto): Promise<Chat> {
    try {
      return await this.chatRepository.updateGroupChat(id, dto);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new NotFoundException('Chat not found');
      throw e;
    }
  }

  async delete(id: number): Promise<Chat> {
    try {
      return await this.chatRepository.delete(id);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new NotFoundException('Chat not found');
      throw e;
    }
  }

  async addUserToChat(chatId: number, userId: number) {
    await this.validateChatType(chatId, ChatType.GROUP);

    return await this.chatRepository.addUserToChat(chatId, userId);
  }

  async deleteUserFromChat(chatId: number, userId: number) {
    await this.validateChatType(chatId, ChatType.GROUP);

    return await this.chatRepository.deleteUserFromChat(chatId, userId);
  }
}
