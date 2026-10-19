import { Message } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types/paginated.types';

export type MessageFiles = Message & { fileNames: string[] };
export type MessageFilesReactionCount = MessageFiles & {
  reactionCount: {
    likeCount: number;
    dislikeCount: number;
    heartCount: number;
    heartWithFire: number;
    fireCount: number;
  };
};

export type PaginatedMessageFiles = Paginated<'messages', MessageFiles>;
export type PaginatedMessageFilesReactionCount = Paginated<
  'messages',
  MessageFilesReactionCount
>;
