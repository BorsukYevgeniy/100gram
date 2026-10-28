import { Module } from '@nestjs/common';
import { MessageCacheService } from './message-cache.service';

@Module({
  providers: [MessageCacheService],
  exports: [MessageCacheService],
})
export class MessageCacheModule {}
