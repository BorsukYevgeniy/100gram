import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatMemberResponseDto } from '@app/contracts/chat-member/dto';
import { ChatMemberPattern } from '@app/contracts/chat-member/pattern';
import {
  AddUserToChatPayload,
  DeleteUserFromChatPayload,
  GetUsersInChatPayload,
} from '@app/contracts/chat-member/payload';
import { UpdateUserRolePayload } from '@app/contracts/chat-member/payload/update-user-role.payload';
import { PaginatedUserNoCredOtpVCode } from '@app/contracts/user/types';
import { ChatMemberService } from './chat-member.service';

@Controller()
export class ChatMemberController {
  constructor(private readonly chatMemberService: ChatMemberService) {}

  @MessagePattern(ChatMemberPattern.GET_USERS_IN_CHAT)
  async getUsersInChat(
    @Payload() { chatId, cursor, limit, ...user }: GetUsersInChatPayload,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    return this.chatMemberService.getUsersInChat(user, chatId, {
      cursor,
      limit,
    });
  }

  @MessagePattern(ChatMemberPattern.ADD_TO_CHAT)
  async addUserToChat(
    @Payload() { chatId, userId }: AddUserToChatPayload,
  ): Promise<ChatMemberResponseDto> {
    return this.chatMemberService.addUserToChat(chatId, userId);
  }

  @MessagePattern(ChatMemberPattern.DELETE_FROM_CHAT)
  async deleteUserFromChat(
    @Payload() { chatId, userId, ...currentUser }: DeleteUserFromChatPayload,
  ) {
    return this.chatMemberService.deleteUserFromChat(
      chatId,
      userId,
      currentUser,
    );
  }

  @MessagePattern(ChatMemberPattern.UPDATE_CHAT_ROLE)
  async updateUserRole(
    @Payload()
    { chatId, userId, newRole, ...currentUser }: UpdateUserRolePayload,
  ) {
    return this.chatMemberService.updateUserChatRole(
      currentUser,
      chatId,
      userId,
      { newRole },
    );
  }
}

