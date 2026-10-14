import { IsEmail, IsString, Length } from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    type: String,
    description: 'The email of the user',
    example: 'example@example.com',
    required: true,
  })
  @IsEmail()
  @Trim()
  email: string;

  @ApiProperty({
    type: String,
    description: 'The nickname of the user',
    example: 'john_doe',
    required: true,
    minLength: 3,
    maxLength: 25,
  })
  @IsString()
  @Trim()
  @Length(3, 25)
  nickname: string;

  @ApiProperty({
    type: String,
    description: 'The password of the user',
    example: 'your_password',
    required: true,
    minLength: 6,
    maxLength: 16,
  })
  @IsString()
  @Trim()
  @Length(6, 16)
  password: string;
}
