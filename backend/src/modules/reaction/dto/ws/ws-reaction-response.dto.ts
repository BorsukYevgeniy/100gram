import { ApiProperty } from '@nestjs/swagger';
import { Reaction } from '../../../../../generated/prisma/enums';

export class WsReactionResponseDto {
  @ApiProperty()
  messageId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: Reaction, enumName: 'Reaction' })
  reaction: Reaction;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
