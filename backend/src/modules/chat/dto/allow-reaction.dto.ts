import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Reaction } from '../../../../generated/prisma/enums';

export class AllowReactionDto {
  @ApiProperty({
    description: 'List of allowed reactions for the chat',
    type: [String],
    enumName: 'Reaction',
    enum: Reaction,
  })
  @IsString({ each: true })
  @IsEnum(Reaction, { each: true })
  allowedReactions: Reaction[];
}
