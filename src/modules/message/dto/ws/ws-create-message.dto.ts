import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';
import { CreateMessageDto } from '../create-message.dto';

export class WsCreateMessageDto extends CreateMessageDto {
  @ApiProperty({
    type: Number,
    required: true,
    description: 'ID of the chat where the message will be sent',
    minimum: 0,
  })
  @IsInt()
  @IsPositive()
  chatId: number;

  @ApiProperty({
    type: [Number],
    required: false,
    description: 'IDs of the files to be attached to the message',
    allOf: [{ minimum: 0 }],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  fileIds?: number[];
}
