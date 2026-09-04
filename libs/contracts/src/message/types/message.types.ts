import { Paginated } from '../../pagination';

export interface Message {
  id: number;
  text: string;
  createdAt: Date;
  replyId: number;
  userId: number;
  chatId: number;
}

export type MessageFiles = Message & { files: File[] };

export type PaginatedMessageFiles = Paginated<'messages', MessageFiles>;
