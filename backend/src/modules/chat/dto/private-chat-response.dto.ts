import { ApiProperty } from '@nestjs/swagger';
import { Chat } from '../../../../generated/prisma/browser';
import { BaseChatResponseDto } from './base-chat-response.dto';
import { ChatParticipantResponseDto } from './chat-participant-response.dto';

export class PrivateChatResponseDto extends BaseChatResponseDto {
  @ApiProperty({
    type: ChatParticipantResponseDto,
    description: 'Nickname and avatarName with whom you have a private chat',
  })
  readonly participant: ChatParticipantResponseDto;

  constructor(chat: Chat, participant: ChatParticipantResponseDto) {
    super(chat);
    this.participant = participant;
  }
}
