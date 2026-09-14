import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';
import { AddReactionDto } from '../add-reaction.dto';

export class WsAddReactionDto extends AddReactionDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where reaction will be added',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where reaction will be added',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  messageId: number;
}
