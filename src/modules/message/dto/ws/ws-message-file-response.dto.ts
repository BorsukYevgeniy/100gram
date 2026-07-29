export class WsMessageFileResponseDto {
  id: number;
  chatId: number;
  text: string;
  createdAt: Date;
  replyId: number;
  userId: number;

  files: {
    id: number;
    name: string;
    createdAt: Date;
    userId: number;
    messageId: number;
  }[];
}
