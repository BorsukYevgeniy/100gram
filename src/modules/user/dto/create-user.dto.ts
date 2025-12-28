import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(3, 25)
  nickname: string;

  @IsString()
  @Length(6, 16)
  password: string;
}
