import { IsInt, IsPositive } from 'class-validator';
import { UpdateMessageDto } from './update-message.dto';

export class UpdateMessageGatewayDto extends UpdateMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsInt()
  @IsPositive()
  messageId: number;
}
