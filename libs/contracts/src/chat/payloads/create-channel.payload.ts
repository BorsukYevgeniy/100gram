import { CreateChannelDto } from '../dto';

export interface CreateChannelPayload {
  userId: number;
  dto: CreateChannelDto;
}
