import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../../../../generated/prisma/browser';
import { ChatType, Visibility } from '../../../../generated/prisma/enums';

export class PrivateChatResponseDto {
  @ApiProperty({
    type: Number,
    description: 'Unique identifier of the chat',
    example: 1,
  })
  readonly id: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'ID of the last message in the chat',
    example: null,
    required: false,
  })
  readonly lastMessageId: number | null;

  @ApiProperty({
    type: String,
    enum: ChatType,
    description: 'Type of the chat',
    example: ChatType.PRIVATE,
  })
  readonly chatType: ChatType;

  @ApiProperty({
    type: String,
    enum: Visibility,
    description: 'Visibility of the chat',
    example: Visibility.PRIVATE,
  })
  readonly visibility: Visibility;

  constructor(chat: Chat) {
    this.id = chat.id;
    this.chatType = chat.chatType;
    this.lastMessageId = chat.lastMessageId;
    this.visibility = chat.visibility;
  }
}
