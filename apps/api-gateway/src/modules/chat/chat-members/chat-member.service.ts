import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AccessTokenPayload } from '@app/contracts/auth';
import {
  ChatMemberResponseDto,
  UpdateRoleDto,
} from '@app/contracts/chat-member/dto';
import { ChatMemberPattern } from '@app/contracts/chat-member/pattern';
import {
  AddUserToChatPayload,
  DeleteUserFromChatPayload,
  GetUsersInChatPayload,
} from '@app/contracts/chat-member/payload';
import { UpdateUserRolePayload } from '@app/contracts/chat-member/payload/update-user-role.payload';
import { ChatMember } from '@app/contracts/chat-member/types/chat-member.types';
import { PaginationDto } from '@app/contracts/pagination';
import { PaginatedUserNoCredOtpVCode } from '@app/contracts/user/types';
import { CHAT_CLIENT } from '../../../common/client/chat/chat-client.constants';

@Injectable()
export class ChatMemberService {
  constructor(@Inject(CHAT_CLIENT) private readonly chatClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: ChatMemberPattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.chatClient.send<TOut, TIn>(pattern, input));
  }

  async getUsersInChat(
    user: AccessTokenPayload,
    chatId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    return this.send<PaginatedUserNoCredOtpVCode, GetUsersInChatPayload>(
      ChatMemberPattern.GET_USERS_IN_CHAT,
      { ...user, chatId, ...paginationDto },
    );
  }

  async addUserToChat(
    chatId: number,
    userId: number,
  ): Promise<ChatMemberResponseDto> {
    return this.send<ChatMemberResponseDto, AddUserToChatPayload>(
      ChatMemberPattern.ADD_TO_CHAT,
      { chatId, userId },
    );
  }

  async deleteUserFromChat(
    chatId: number,
    userId: number,
    currentUser: AccessTokenPayload,
  ): Promise<ChatMemberResponseDto> {
    return this.send<ChatMemberResponseDto, DeleteUserFromChatPayload>(
      ChatMemberPattern.DELETE_FROM_CHAT,
      { ...currentUser, chatId, userId },
    );
  }

  async updateUserChatRole(
    currentUser: AccessTokenPayload,
    chatId: number,
    userId: number,
    dto: UpdateRoleDto,
  ): Promise<ChatMember> {
    return this.send<ChatMember, UpdateUserRolePayload>(
      ChatMemberPattern.UPDATE_CHAT_ROLE,
      { ...currentUser, chatId, userId, ...dto },
    );
  }
}

