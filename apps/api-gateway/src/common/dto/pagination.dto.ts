import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  // There cursor means that it is ID of smth resource.For example, in case of messages it will be message ID.

  @ApiProperty({
    type: Number,
    description: 'ID of smth resource',
    required: true,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cursor: number;

  @ApiProperty({
    type: Number,
    description: 'Quantity of items of smth resource',
    required: true,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit: number = 10;
}
