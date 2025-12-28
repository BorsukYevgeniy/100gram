import { IsInt, IsPositive } from 'class-validator';

export class CreatePrivateChatDto {
  @IsInt()
  @IsPositive()
  userId: number;
}
