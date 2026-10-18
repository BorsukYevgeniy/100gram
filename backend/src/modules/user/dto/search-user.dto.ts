import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class SearchUserDto extends OmitType(CreateUserDto, [
  'email',
  'password',
]) {}
