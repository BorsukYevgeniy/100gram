import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { REDIS_CLIENT } from './redis.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis(configService.REDIS_CONFIG);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
