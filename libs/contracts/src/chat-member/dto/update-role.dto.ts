import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ChatRole } from '../../../../../apps/chat/generated/prisma/enums';

export class UpdateRoleDto {
  @ApiProperty({
    type: String,
    enum: ChatRole,
    required: true,
    description: 'A new role of user',
  })
  @IsString()
  @IsEnum(ChatRole)
  newRole: ChatRole;
}
