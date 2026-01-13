import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';

export class WsCreateMessageDto extends CreateMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  fileIds?: number[];
}
