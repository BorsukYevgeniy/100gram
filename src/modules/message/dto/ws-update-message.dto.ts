import { IsArray, IsInt, IsOptional, IsPositive } from 'class-validator';
import { UpdateMessageDto } from './update-message.dto';

export class WsUpdateMessageDto extends UpdateMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsInt()
  @IsPositive()
  messageId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  fileIds: number[];
}
