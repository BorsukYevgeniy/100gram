import { CreatePrivateChatDto } from '../dto';

export interface CreatePrivateChatPayload {
  userId: number;
  dto: CreatePrivateChatDto;
}
