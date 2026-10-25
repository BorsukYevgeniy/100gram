import { PickType } from '@nestjs/swagger';
import { CommonChatMemberDto } from './common-chat-member.dto';

export class WsJoinLeaveChatDto extends PickType(CommonChatMemberDto, [
  'chatId',
]) {}
