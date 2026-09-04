import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatMember } from '@app/contracts/chat-member/types/chat-member.types';
import {
  ChannelGroupChatResponseDto,
  PrivateChatResponseDto,
} from '@app/contracts/chat/dto';
import { ChatPattern } from '@app/contracts/chat/pattern';
import {
  AddChatByInviteTokenPayload,
  ChatActionPayload,
  CreateChannelPayload,
  CreateGroupChatPayload,
  CreatePrivateChatPayload,
  GetMyChatPayload,
  UpdateGroupChatPayload,
  UpdateOwnerPayload,
} from '@app/contracts/chat/payloads';
import {
  Chat,
  PaginatedMyChats,
} from '@app/contracts/chat/types/chat.types';
import { ChatService } from './chat.service';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @MessagePattern(ChatPattern.GET_MY_CHATS)
  async getMyChats(
    @Payload() { userId, dto }: GetMyChatPayload,
  ): Promise<PaginatedMyChats> {
    return this.chatService.getMyChats(userId, dto);
  }

  @MessagePattern(ChatPattern.CREATE_PRIVATE_CHAT)
  async createPrivateChat(
    @Payload() { userId, dto }: CreatePrivateChatPayload,
  ): Promise<PrivateChatResponseDto> {
    return this.chatService.createPrivateChat(userId, dto);
  }

  @MessagePattern(ChatPattern.CREATE_GROUP_CHAT)
  async createGroupChat(
    @Payload() { userId, dto }: CreateGroupChatPayload,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.chatService.createGroupChat(userId, dto);
  }

  @MessagePattern(ChatPattern.CREATE_CHANNEL)
  async createChannel(
    @Payload() { userId, dto }: CreateChannelPayload,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.chatService.createChannel(dto, userId);
  }

  @MessagePattern(ChatPattern.ADD_CHAT_BY_INVITE_TOKEN)
  async addChatByInviteToken(
    @Payload() { user, inviteToken }: AddChatByInviteTokenPayload,
  ): Promise<ChatMember> {
    return this.chatService.addChatByInviteToken(user, inviteToken);
  }

  @MessagePattern(ChatPattern.UPDATE_INVITE_TOKEN)
  async updateInviteToken(
    @Payload() { chatId, user }: ChatActionPayload,
  ): Promise<Chat> {
    return this.chatService.updateInviteToken(user, chatId);
  }

  @MessagePattern(ChatPattern.FIND_ONE)
  async findOne(
    @Payload() { chatId, user }: ChatActionPayload,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    return this.chatService.findById(user, chatId);
  }

  @MessagePattern(ChatPattern.UPDATE_OWNER)
  async updateOwner(
    @Payload() { chatId, ownerId, user }: UpdateOwnerPayload,
  ): Promise<ChatMember> {
    return this.chatService.updateOwner(chatId, user, ownerId);
  }

  @MessagePattern(ChatPattern.UPDATE_GROUP_CHAT)
  async updateGroupChat(
    @Payload() { chatId, dto }: UpdateGroupChatPayload,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.chatService.updateGroupChat(chatId, dto);
  }

  @MessagePattern(ChatPattern.DELETE)
  async delete(
    @Payload() { chatId, user }: ChatActionPayload,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    return this.chatService.delete(user, chatId);
  }
}
