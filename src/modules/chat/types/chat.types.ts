import { Chat, Message } from '../../../../generated/prisma/browser';
import { Paginated } from '../../../common/types';
import { ChannelGroupChatResponseDto } from '../dto/channel-group-chat-response.dto';
import { PrivateChatResponseDto } from '../dto/private-chat-response.dto';

export type MyChat = Pick<Chat, 'id' | 'title' | 'avatarName'> & {
  lastMessage: Pick<Message, 'text' | 'createdAt'>;
};

export type PaginatedMyChats = Paginated<'chats', MyChat>;
export type ChatResponse = PrivateChatResponseDto | ChannelGroupChatResponseDto;
