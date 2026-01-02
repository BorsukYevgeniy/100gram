import { IsInt, IsPositive } from 'class-validator';

export class DeleteMessageGatewayDto {
  @IsInt()
  @IsPositive()
  chatId: number;

  @IsInt()
  @IsPositive()
  messageId: number;
}
