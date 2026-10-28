import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { UserCacheService } from './user-cache.service';

@Module({
  imports: [RedisModule],
  providers: [UserCacheService],
  exports: [UserCacheService],
})
export class UserCacheModule {}
