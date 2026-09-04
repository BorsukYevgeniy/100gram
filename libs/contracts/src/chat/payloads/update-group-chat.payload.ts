import { UpdateGroupChatDto } from '../dto/update-group-chat.dto';

export interface UpdateGroupChatPayload {
  chatId: number;
  dto: UpdateGroupChatDto;
}
