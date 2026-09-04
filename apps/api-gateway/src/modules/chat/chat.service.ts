import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AccessTokenPayload } from '@app/contracts/auth';
import { ChatMember } from '@app/contracts/chat-member/types/chat-member.types';
import {
  ChannelGroupChatResponseDto,
  CreateChannelDto,
  CreateGroupChatDto,
  CreatePrivateChatDto,
  PrivateChatResponseDto,
} from '@app/contracts/chat/dto';
import { UpdateGroupChatDto } from '@app/contracts/chat/dto/update-group-chat.dto';
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
} from '@app/contracts/chat/types';
import { PaginationDto } from '@app/contracts/pagination';
import { CHAT_CLIENT } from '../../common/client/chat/chat-client.constants';

@Injectable()
export class ChatService {
  constructor(@Inject(CHAT_CLIENT) private readonly chatClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: ChatPattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.chatClient.send<TOut, TIn>(pattern, input));
  }

  async getMyChats(
    userId: number,
    dto: PaginationDto,
  ): Promise<PaginatedMyChats> {
    return this.send<PaginatedMyChats, GetMyChatPayload>(
      ChatPattern.GET_MY_CHATS,
      { userId, dto },
    );
  }

  async createPrivateChat(
    userId: number,
    dto: CreatePrivateChatDto,
  ): Promise<PrivateChatResponseDto> {
    return this.send<PrivateChatResponseDto, CreatePrivateChatPayload>(
      ChatPattern.CREATE_PRIVATE_CHAT,
      { userId, dto },
    );
  }

  async createGroupChat(
    userId: number,
    dto: CreateGroupChatDto,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.send<ChannelGroupChatResponseDto, CreateGroupChatPayload>(
      ChatPattern.CREATE_GROUP_CHAT,
      { userId, dto },
    );
  }

  async createChannel(
    userId: number,
    dto: CreateChannelDto,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.send<ChannelGroupChatResponseDto, CreateChannelPayload>(
      ChatPattern.CREATE_CHANNEL,
      { userId, dto },
    );
  }

  async addUserByInviteToken(
    user: AccessTokenPayload,
    inviteToken: string,
  ): Promise<ChatMember> {
    return this.send<ChatMember, AddChatByInviteTokenPayload>(
      ChatPattern.ADD_CHAT_BY_INVITE_TOKEN,
      { user, inviteToken },
    );
  }

  async updateInviteToken(
    chatId: number,
    user: AccessTokenPayload,
  ): Promise<Chat> {
    return this.send<Chat, ChatActionPayload>(ChatPattern.UPDATE_INVITE_TOKEN, {
      chatId,
      user,
    });
  }

  async findById(
    chatId: number,
    user: AccessTokenPayload,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    return this.send<
      PrivateChatResponseDto | ChannelGroupChatResponseDto,
      ChatActionPayload
    >(ChatPattern.FIND_ONE, { chatId, user });
  }

  async updateOwner(
    chatId: number,
    ownerId: number,
    user: AccessTokenPayload,
  ): Promise<ChatMember> {
    return this.send<ChatMember, UpdateOwnerPayload>(ChatPattern.UPDATE_OWNER, {
      chatId,
      ownerId,
      user,
    });
  }

  async updateGroupChat(
    chatId: number,
    dto: UpdateGroupChatDto,
  ): Promise<ChannelGroupChatResponseDto> {
    return this.send<ChannelGroupChatResponseDto, UpdateGroupChatPayload>(
      ChatPattern.UPDATE_GROUP_CHAT,
      { chatId, dto },
    );
  }

  async delete(
    chatId: number,
    user: AccessTokenPayload,
  ): Promise<PrivateChatResponseDto | ChannelGroupChatResponseDto> {
    return this.send<
      PrivateChatResponseDto | ChannelGroupChatResponseDto,
      ChatActionPayload
    >(ChatPattern.DELETE, { chatId, user });
  }
}
