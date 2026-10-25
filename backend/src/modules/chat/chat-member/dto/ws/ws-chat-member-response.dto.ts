import { ApiProperty } from '@nestjs/swagger';
import { ChatRole } from '../../../../../../generated/prisma/enums';

export class WsChatMemberResponseDto {
  @ApiProperty()
  chatId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: ChatRole, enumName: 'ChatRole' })
  role: ChatRole;

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  connectedAt: Date;
}

export class WsChatMemberChangeResponseDto {
  @ApiProperty({ type: WsChatMemberResponseDto })
  member: WsChatMemberResponseDto;

  @ApiProperty()
  membersCount: number;
}
