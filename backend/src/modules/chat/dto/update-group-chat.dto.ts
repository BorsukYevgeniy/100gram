import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateGroupChatDto } from './create-group-chat.dto';

export class UpdateGroupChatDto extends PartialType(
  OmitType(CreateGroupChatDto, ['userIds']),
) {}
