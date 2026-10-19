import { Module } from '@nestjs/common';
import { MessageMapperService } from './message-mapper.service';

@Module({
  providers: [MessageMapperService],
  exports: [MessageMapperService],
})
export class MessageMapperModule {}
