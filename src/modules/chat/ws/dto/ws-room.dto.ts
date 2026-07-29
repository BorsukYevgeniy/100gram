import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class WsRoomDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where you will be connected',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  chatId: number;
}
