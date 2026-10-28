import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ChatCacheService } from './chat-cache.service';

@Module({
  imports: [RedisModule],
  providers: [ChatCacheService],
  exports: [ChatCacheService],
})
export class ChatCacheModule {}
