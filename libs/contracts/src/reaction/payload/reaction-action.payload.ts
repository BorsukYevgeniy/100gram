import { AddReactionDto, UpdateReactionDto } from '../dto';

export interface ReactionActionPayload<
  T extends AddReactionDto | UpdateReactionDto,
> {
  userId: number;
  messageId: number;
  dto?: T;
}
