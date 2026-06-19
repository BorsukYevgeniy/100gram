import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

import { RedisModule } from '@nestjs-modules/ioredis';
import Redis, { Cluster } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService, PinoLogger],
      useFactory: (cf: ConfigService, logger: PinoLogger) => {
        logger.setContext(RedisModule.name);
        return {
          ...cf.REDIS_CONFIG,
          onClientReady: (client: Redis | Cluster) => {
            client.on('connect', () => logger.debug('Redis connected'));

            client.on('error', (err) =>
              logger.fatal({ err }, 'Cannot connect to Redis'),
            );

            client.on('reconnecting', (ms) =>
              logger.warn({ ms }, 'Redis reconnecting'),
            );

            client.on('close', () => logger.debug('Redis connection closed'));
            client.on('end', () => logger.warn('Redis connection ended'));
          },
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
