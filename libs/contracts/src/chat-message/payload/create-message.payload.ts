import { AccessTokenPayload } from '../../auth';
import { CreateMessageDto } from '../../message/dto';

export type CreateMessagePayload = {
  chatId: number;
  files: Express.Multer.File[];
} & AccessTokenPayload &
  CreateMessageDto;
