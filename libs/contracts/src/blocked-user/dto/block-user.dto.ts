import { IsInt, IsPositive } from 'class-validator';

export class BlockUserDto {
  @IsInt()
  @IsPositive()
  blockerId: number;

  @IsInt()
  @IsPositive()
  blockedId: number;
}
