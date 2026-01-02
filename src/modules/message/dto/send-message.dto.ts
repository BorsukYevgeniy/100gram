import { IsInt, IsPositive } from 'class-validator';
import { CreateMessageDto } from './create-message.dto';

export class SendMessageDto extends CreateMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;
}
