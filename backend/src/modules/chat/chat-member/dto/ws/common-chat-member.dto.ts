import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CommonChatMemberDto {
  @ApiProperty({
    type: Number,
    required: true,
    description:
      'ID of the chat where user will be added or removed or updated role',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description:
      'ID of the user who will be added or removed or updated role in chat',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  userId: number;
}
