import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cursor: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number = 10;
}
