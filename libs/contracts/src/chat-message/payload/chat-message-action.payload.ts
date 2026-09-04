import { AccessTokenPayload } from '../../auth';
import { CreateMessageDto } from '../../message/dto';
import { PaginationDto } from '../../pagination';

export interface ChatMessageAction<T extends PaginationDto | CreateMessageDto> {
  chatId: number;
  user: AccessTokenPayload;
  dto: T;
}
