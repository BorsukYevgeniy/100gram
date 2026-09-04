import { AccessTokenPayload } from '../../auth';
import { PaginationDto } from '../../pagination';

export type GetAllMessagesInChatPayload = {
  chatId: number;
} & AccessTokenPayload &
  PaginationDto;
