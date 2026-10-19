import { Message } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types/paginated.types';

export type MessageFiles = Message & { fileNames: string[] };
export type MessageFilesReactionCount = MessageFiles & {
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
