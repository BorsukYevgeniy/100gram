import { ApiProperty } from '@nestjs/swagger';
import { UpdateRoleDto } from '../update-role.dto';
import { CommonChatMemberDto } from './common-chat-member.dto';

export class WsUpdateChatRoleDto extends CommonChatMemberDto {
  @ApiProperty({
    type: UpdateRoleDto,
    required: true,
  })
  dto: UpdateRoleDto;
}
