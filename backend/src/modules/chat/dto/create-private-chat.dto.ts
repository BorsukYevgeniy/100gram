import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreatePrivateChatDto {
  @ApiProperty({
    type: Number,
    description: 'ID of user with which you want to create a private chat',
    required: true,
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  userId: number;
}
