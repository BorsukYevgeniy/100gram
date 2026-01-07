import { Message } from '../../../../generated/prisma/client';
import { Paginated } from '../../../common/types/paginated.types';
export type PaginatedMessages = Paginated<'messages', Message>;
