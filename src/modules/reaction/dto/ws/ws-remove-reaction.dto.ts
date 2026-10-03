import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class WsRemoveReactionDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat containing the message',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the message whose reaction will be removed',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  messageId: number;
}
