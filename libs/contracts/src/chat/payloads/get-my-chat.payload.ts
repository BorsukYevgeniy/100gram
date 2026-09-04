import { PaginationDto } from '../../pagination';

export interface GetMyChatPayload {
  dto: PaginationDto;
  userId: number;
}
