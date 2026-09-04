import { UpdateMessageDto } from '../dto';
import { MessageActionPayload } from './message-action.payload';

export interface UpdateMessagepayload extends MessageActionPayload {
  updateMessageDto: UpdateMessageDto;
  files: Express.Multer.File[];
}
