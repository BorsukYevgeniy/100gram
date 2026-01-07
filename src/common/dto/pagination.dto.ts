import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  cursor: number;

  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  limit: number = 10;
}
