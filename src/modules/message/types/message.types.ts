import { File, Message } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types/paginated.types';

export type MessageFiles = Message & { files: File[] };

export type PaginatedMessageFiles = Paginated<'messages', MessageFiles>;
