import { CreateGroupChatDto } from '../dto';

export interface CreateGroupChatPayload {
  userId: number;
  dto: CreateGroupChatDto;
}
