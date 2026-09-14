import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class WsRemoveReactionDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where the message reaection will be removed',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where the message reaection will be removed',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  messageId: number;
}
