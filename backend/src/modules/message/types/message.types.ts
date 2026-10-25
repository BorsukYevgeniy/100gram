import { Message } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types/paginated.types';

export type MessageFilesWithUserObject = Omit<Message, 'userId'> & {
  fileNames: string[];
  user: { id: number; nickname: string };
};

export type MessageFiles = Omit<Message, 'userId'> & {
  fileNames: string[];
  user: { id: number; nickname: string };
};

export type MessageFilesReactionCount = MessageFilesWithUserObject & {
  reactions: {
    like: { count: number; isReactedByMe: boolean };
    dislike: { count: number; isReactedByMe: boolean };
    heart: { count: number; isReactedByMe: boolean };
    heartWithFire: { count: number; isReactedByMe: boolean };
    fire: { count: number; isReactedByMe: boolean };
  };
};

export type PaginatedMessageFiles = Paginated<'messages', MessageFiles>;
export type PaginatedMessageFilesReactionCount = Paginated<
  'messages',
  MessageFilesReactionCount
>;
