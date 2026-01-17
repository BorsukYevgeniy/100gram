import { IsEnum, IsString } from 'class-validator';
import { Reaction } from '../../../../generated/prisma/enums';
export class AddReactionDto {
  @IsString()
  @IsEnum(Reaction)
  reaction: Reaction;
}
