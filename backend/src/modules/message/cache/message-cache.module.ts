import { Module } from '@nestjs/common';
import { RedisModule } from '../../../infra/redis/redis.module';
import { MessageCacheService } from './message-cache.service';

@Module({
  imports: [RedisModule],
  providers: [MessageCacheService],
  exports: [MessageCacheService],
})
export class MessageCacheModule {}
