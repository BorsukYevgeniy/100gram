import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class ChatParticipantResponseDto extends PickType(CreateUserDto, [
  'nickname',
]) {
  @ApiProperty({
    type: String,
    description: 'AvatarName with whom you have a private chat',
  })
  @IsString()
  avatarName: string;
}
