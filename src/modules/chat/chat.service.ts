import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Chat, ChatType, Role } from '../../../generated/prisma/client';
import { AccessTokenPayload } from '../../common/types';
import { ChatRepository } from './chat.repository';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  private async validateChatType(chatId: number, expectedType: ChatType) {
    const chat = await this.chatRepository.getById(chatId);

    if (!chat) throw new NotFoundException('Chat not found');

    if (chat.chatType !== expectedType)
      throw new BadRequestException(`Chat is not of type ${expectedType}`);
  }

  async validateChatParticipation(
    user: AccessTokenPayload,
    chatId: number,
  ): Promise<void> {
    const chat: Chat | null = await this.chatRepository.getById(chatId);

    if (!chat) throw new NotFoundException('Chat not found');

    if (user.role === Role.ADMIN) return;

    const usersInChat = await this.chatRepository.getUsersInChat(chatId);

    const isParticipant = usersInChat.some((u) => u.user.id === user.id);

    if (!isParticipant)
      throw new ForbiddenException('User is not a participant of the chat');
  }

  private async checkChatParticipation(
    userId: number,
    chatId: number,
  ): Promise<boolean> {
    const usersInChat = await this.chatRepository.getUsersInChat(chatId);

    return usersInChat.some((u) => u.user.id === userId);
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

  async findById(user: AccessTokenPayload, chatId: number): Promise<Chat> {
    await this.validateChatParticipation(user, chatId);

    const chat: Chat | null = await this.chatRepository.getById(chatId);

    if (!chat) throw new NotFoundException('Chat not found');

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

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (isParticipant)
      throw new BadRequestException(
        'User already is a participant of the chat',
      );

    return await this.chatRepository.addUserToChat(chatId, userId);
  }

  async deleteUserFromChat(chatId: number, userId: number) {
    const chat = await this.chatRepository.getById(chatId);

    if (!chat) throw new NotFoundException('Chat not found');

    const isParticipant = await this.checkChatParticipation(userId, chatId);

    if (!isParticipant)
      throw new ForbiddenException('User is not a participant of the chat');

    if (chat.chatType === ChatType.PRIVATE)
      return await this.chatRepository.delete(chatId);

    if (chat.ownerId !== userId)
      return await this.chatRepository.deleteUserFromChat(chatId, userId);

    const participants = await this.chatRepository.getUsersInChat(chatId);
    const { user: newOwner } = participants.find((u) => u.user.id !== userId);

    if (newOwner) {
      return await this.chatRepository.updateOwnerAndDeleteUser(
        chatId,
        newOwner.id,
        userId,
      );
    }

    return await this.chatRepository.delete(chatId);
  }

  async getUserIdsInChat(user: AccessTokenPayload, chatId: number) {
    await this.validateChatParticipation(user, chatId);

    const users = await this.chatRepository.getUsersInChat(chatId);

    return {
      users: users.map((u) => u.user),
    };
  }

  async updateOwner(chatId: number, newOwnerId: number): Promise<Chat> {
    await this.validateChatType(chatId, ChatType.GROUP);
    try {
      return await this.chatRepository.updateOwner(chatId, newOwnerId);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003')
        throw new NotFoundException('User not found');
    }
  }

  async getNewOwnerId(chatId: number, currentOnwerId: number) {
    return await this.chatRepository.findNewOwner(chatId, currentOnwerId);
  }
}
