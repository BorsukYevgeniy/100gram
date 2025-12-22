import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMessageDto } from './create-message.dto';

export class UpdateMessageDto extends PartialType(
  OmitType(CreateMessageDto, ['chatId']),
) {}
