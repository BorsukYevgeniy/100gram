import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../../../../generated/prisma/browser';
import { BaseChatResponseDto } from './base-chat-response.dto';

export class PrivateChatResponseDto extends BaseChatResponseDto {
  @ApiProperty({
    type: String,
    description: 'User with whom you have a private chat',
  })
  readonly withWhom: string;

  constructor(chat: Chat, withWhom: string) {
    super(chat);
    this.withWhom = withWhom;
  }
}
