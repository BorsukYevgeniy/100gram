import { Message } from '../../message/types';
import { Paginated } from '../../pagination';
import { ChannelGroupChatResponseDto } from '../dto/channel-group-chat-response.dto';
import { PrivateChatResponseDto } from '../dto/private-chat-response.dto';

export type Chat = {
  id: number;
  title: string;
  avatar: string;
  description: string;
  visibility: 'PRIVATE' | 'PUBLIC';
  inviteToken: string;
  chatType: 'PRIVATE' | 'GROUP' | 'CHANNEL';
  membersCount: number;
  lastMessageId: number;
};

export type MyChat = Pick<Chat, 'id' | 'title' | 'avatar'> & {
  lastMessage: Pick<Message, 'text' | 'createdAt'>;
};

export type PaginatedMyChats = Paginated<'chats', MyChat>;
export type ChatResponse = PrivateChatResponseDto | ChannelGroupChatResponseDto;

export enum ChatVisibilityEnum {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}
export type ChatVisibilityType = 'PRIVATE' | 'PUBLIC';

export enum ChatTypeEnum {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
}
export type ChatTypeType = 'PRIVATE' | 'GROUP' | 'CHANNEL';
