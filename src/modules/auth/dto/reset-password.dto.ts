import { IsInt, IsString, Length, Max, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class ResetPasswordDto {
  @IsInt()
  @Min(100_000)
  @Max(1_000_000)
  code: number;

  @IsString()
  @Trim()
  @Length(6, 16)
  newPassword: string;
}
