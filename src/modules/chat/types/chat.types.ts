import { Chat, Message } from '../../../../generated/prisma/browser';
import { Paginated } from '../../../common/types';

export type MyChat = Pick<Chat, 'id' | 'title' | 'avatar'> & {
  lastMessage: Pick<Message, 'text' | 'createdAt'>;
};

export type PaginatedMyChats = Paginated<'chats', MyChat>;
