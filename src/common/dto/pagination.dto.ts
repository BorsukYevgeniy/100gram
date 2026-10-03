import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    type: Number,
    description: 'ID used to continue pagination from the last item',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cursor: number;

  @ApiProperty({
    type: Number,
    description: 'Maximum number of items to return',
    required: false,
    default: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number = 10;
}
