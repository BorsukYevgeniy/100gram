import { ChatType, Message } from '../../../../generated/prisma/browser';
import { Paginated } from '../../../common/types';
import { ChannelGroupChatResponseDto } from '../dto/channel-group-chat-response.dto';
import { PrivateChatResponseDto } from '../dto/private-chat-response.dto';

type LastMessage = Pick<Message, 'text' | 'createdAt'>;

type BaseMyChat = {
  id: number;
  lastMessage: LastMessage | null;
  isPinned: boolean;
  chatType: ChatType;
};

export type MyPrivateChat = BaseMyChat & {
  participant: {
    nickname: string;
    avatarName: string | null;
  };
};

export type MyGroupChannelChat = BaseMyChat & {
  title: string;
  avatarName: string | null;
};

export type MyChat = MyPrivateChat | MyGroupChannelChat;

// export type MyChat = Pick<Chat, 'id' | 'title' | 'avatarName'> & {
//   lastMessage: Pick<Message, 'text' | 'createdAt'>;
//   isPinned: boolean;
// };

export type PaginatedMyChats = Paginated<'chats', MyChat>;
export type ChatResponse = PrivateChatResponseDto | ChannelGroupChatResponseDto;
