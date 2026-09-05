import { ApiProperty } from '@nestjs/swagger';
import { Chat, ChatTypeEnum, ChatVisibilityEnum } from '../types';

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
    enum: ChatTypeEnum,
    description: 'Type of the chat',
    example: ChatTypeEnum.PRIVATE,
  })
  readonly chatType: ChatTypeEnum;

  @ApiProperty({
    type: String,
    enum: ChatVisibilityEnum,
    description: 'Visibility of the chat',
    example: ChatVisibilityEnum.PRIVATE,
  })
  readonly visibility: ChatVisibilityEnum;

  constructor(chat: Chat) {
    this.id = chat.id;
    this.chatType = chat.chatType as ChatTypeEnum;
    this.lastMessageId = chat.lastMessageId;
    this.visibility = chat.visibility as ChatVisibilityEnum;
  }
}
