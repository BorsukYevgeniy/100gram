import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class CreateMessageDto {
  @ApiProperty({
    type: String,
    required: true,
    description: 'Text of your message',
    minLength: 1,
    maxLength: 3_000,
  })
  @IsString()
  @Length(1, 3_000)
  @Trim()
  text: string;

  @ApiProperty({
    type: Number,
    description: 'Id of message which you want reply',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  replyId?: number;
}
