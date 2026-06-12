import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class ResetPasswordDto {
  @ApiProperty({
    type: Number,

    description: 'Code that you can give on your email',
    required: true,
    minimum: 100_000,
    maximum: 1_000_000,
  })
  @IsInt()
  @Min(100_000)
  @Max(1_000_000)
  code: number;

  @ApiProperty({
    type: String,
    description: 'New password',
    required: true,
    minLength: 6,
    maxLength: 16,
  })
  @IsString()
  @Trim()
  @Length(6, 16)
  newPassword: string;
}
