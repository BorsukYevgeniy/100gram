import { Module } from '@nestjs/common';
import { RedisModule } from '../../../infra/redis/redis.module';
import { ChatCacheService } from './chat-cache.service';

@Module({
  imports: [RedisModule],
  providers: [ChatCacheService],
  exports: [ChatCacheService],
})
export class ChatCacheModule {}
