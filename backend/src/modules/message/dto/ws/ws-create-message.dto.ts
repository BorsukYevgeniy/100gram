import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { CreateMessageDto } from '../create-message.dto';

export class WsCreateMessageDto extends CreateMessageDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where the message will be sent',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Names of uploaded files to attach to the message',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filenames?: string[];
}
