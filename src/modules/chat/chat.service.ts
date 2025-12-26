import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat, ChatType, Role } from '../../../generated/prisma/client';
import { JwtPayload } from '../../common/interfaces';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  private async validateChatType(chatId: number, expectedType: ChatType) {
    const chat = await this.chatRepository.getById(chatId);

    if (chat.chatType !== expectedType)
      throw new BadRequestException(`Chat is not of type ${expectedType}`);
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
    if (userId === createChatDto.userId)
      throw new BadRequestException('Cannot create private chat with yourself');

    try {
      return await this.chatRepository.createPrivateChat(
        userId,
        createChatDto.userId,
      );
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003')
        throw new BadRequestException('User not found');
    }
  }

  async createGroupChat(
    ownerId: number,
    dto: CreateGroupChatDto,
  ): Promise<Chat> {
    try {
      return await this.chatRepository.createGroupChat(ownerId, dto);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003')
        throw new BadRequestException('User not found');
    }
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
    const chat = await this.chatRepository.getById(chatId);

    if (chat.chatType === ChatType.PRIVATE)
      return await this.chatRepository.delete(chatId);

    if (chat.ownerId !== userId)
      return await this.chatRepository.deleteUserFromChat(chatId, userId);

    const participants = await this.chatRepository.getUserIdsInChat(chatId);

    const newOwner = participants.find((u) => u.userId !== userId);

    if (newOwner) {
      await this.chatRepository.updateOwner(chatId, newOwner.userId);
    }

    return await this.chatRepository.deleteUserFromChat(chatId, userId);
  }

  async getUserIdsInChat(chatId: number): Promise<{ userId: number }[]> {
    return await this.chatRepository.getUserIdsInChat(chatId);
  }

  async updateOwner(chatId: number, newOwnerId: number): Promise<Chat> {
    return await this.chatRepository.updateOwner(chatId, newOwnerId);
  }
}
