import { Module } from '@nestjs/common';
import { RedisModule } from '../../../infra/redis/redis.module';
import { UserCacheService } from './user-cache.service';

@Module({
  imports: [RedisModule],
  providers: [UserCacheService],
  exports: [UserCacheService],
})
export class UserCacheModule {}
