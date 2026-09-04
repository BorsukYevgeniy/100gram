import { ChatRoleType } from '../types/chat-member.types';

export class ChatMemberResponseDto {
  userId: number;
  chatId: number;
  role: ChatRoleType;
  connectedAt: Date;
  membersCount: number;
}
