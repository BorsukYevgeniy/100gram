import { OmitType } from '@nestjs/swagger';
import { WsUpdateMessageDto } from './ws-update-message.dto';

export class WsDeleteMessageDto extends OmitType(WsUpdateMessageDto, [
  'fileIds',
  'text',
]) {}
