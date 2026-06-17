import { Module } from '@nestjs/common';
import { RedisModule } from '../../infra/redis/redis.module';
import { CacheService } from './cache.service';

@Module({
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
