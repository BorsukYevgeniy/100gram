import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  // There cursor means that it is ID of smth resource.For example, in case of messages it will be message ID.

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
