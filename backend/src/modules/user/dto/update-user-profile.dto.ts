import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserProfileDto extends OmitType(CreateUserDto, [
  'email',
  'password',
]) {}
