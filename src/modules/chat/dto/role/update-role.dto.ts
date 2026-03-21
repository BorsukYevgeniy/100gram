import { IsEnum, IsString } from 'class-validator';
import { ChatRole } from '../../../../../generated/prisma/enums';

export class UpdateRoleDto {
  @IsString()
  @IsEnum(ChatRole)
  role: ChatRole;
}
