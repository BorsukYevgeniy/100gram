import { OmitType } from '@nestjs/swagger';
import { CreateGroupChatDto } from './create-group-chat.dto';

export class CreateChannelDto extends OmitType(CreateGroupChatDto, [
  'userIds',
]) {}
