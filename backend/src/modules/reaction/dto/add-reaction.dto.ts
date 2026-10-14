import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Reaction } from '../../../../generated/prisma/enums';

export class AddReactionDto {
  @ApiProperty({ enum: Reaction, enumName: 'Reaction' })
  @IsString()
  @IsEnum(Reaction)
  reaction: Reaction;
}
