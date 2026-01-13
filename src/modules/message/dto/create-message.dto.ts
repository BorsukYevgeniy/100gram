import { IsString, Length } from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class CreateMessageDto {
  @IsString()
  @Length(1, 3_000)
  @Trim()
  text: string;
}
