import { IsInt, IsPositive } from 'class-validator';

export class WsDeleteMessageDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsInt()
  @IsPositive()
  messageId: number;
}
