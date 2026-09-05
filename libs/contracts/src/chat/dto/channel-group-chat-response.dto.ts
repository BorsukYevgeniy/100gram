import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../types';
import { PrivateChatResponseDto } from './private-chat-response.dto';

export class ChannelGroupChatResponseDto extends PrivateChatResponseDto {
  @ApiProperty({
    type: String,
    description: 'Title of the group chat',
  })
  readonly title: string;

  @ApiProperty({
    type: String,
    description: 'Description of the group chat',
    nullable: true,
    required: false,
  })
  readonly description: string;

  @ApiProperty({
    type: String,
    description: 'Avatar URL for the group chat',
    nullable: true,
    required: false,
  })
  readonly avatar: string | null;

  @ApiProperty({
    type: Number,
    description: 'Number of members in the group chat',
  })
  readonly membersCount: number;

  @ApiProperty({
    type: String,
    description: 'Invite token for joining the chat',
  })
  readonly inviteToken: string;

  constructor(chat: Chat) {
    super(chat);
    this.title = chat.title;
    this.description = chat.description;
    this.avatar = chat.avatar;
    this.membersCount = chat.membersCount;
    this.inviteToken = chat.inviteToken;
  }
}
