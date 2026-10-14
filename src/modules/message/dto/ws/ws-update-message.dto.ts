import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { UpdateMessageDto } from '../update-message.dto';

export class WsUpdateMessageDto extends UpdateMessageDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where the message will be updated',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the message to update',
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  messageId: number;

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
