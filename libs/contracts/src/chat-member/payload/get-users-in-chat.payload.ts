import { AccessTokenPayload } from '../../auth';
import { PaginationDto } from '../../pagination';

export type GetUsersInChatPayload = {
  chatId: number;
} & PaginationDto &
  AccessTokenPayload;
