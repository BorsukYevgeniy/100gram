import { IsEmail, IsString, Length } from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class CreateUserDto {
  @IsEmail()
  @Trim()
  email: string;

  @IsString()
  @Trim()
  @Length(3, 25)
  nickname: string;

  @IsString()
  @Trim()
  @Length(6, 16)
  password: string;
}
