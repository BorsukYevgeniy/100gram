import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigType } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';
import redisConfig from '../../config/redis.config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule.forFeature(redisConfig)],
      inject: [redisConfig.KEY, PinoLogger],
      useFactory: (
        config: ConfigType<typeof redisConfig>,
        logger: PinoLogger,
      ) => {
        logger.setContext(RedisModule.name);
        return {
          ...config,
          onClientReady: (client: Redis | Cluster) => {
            client.on('connect', () => logger.debug('Redis connected'));

            client.on('error', (err) =>
              logger.fatal({ err }, 'Cannot connect to Redis'),
            );

            client.on('reconnecting', (ms) =>
              logger.warn({ ms }, 'Redis reconnecting '),
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
