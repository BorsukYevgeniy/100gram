import { IsEnum, IsString } from 'class-validator';
import { ReactionEnum } from '../types/reaction.types';

export class AddReactionDto {
  @IsString()
  @IsEnum(ReactionEnum)
  reaction: ReactionEnum;
}
