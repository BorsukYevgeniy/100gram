import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { registerAs } from '@nestjs/config';

export default registerAs(
  'redis',
  (): RedisModuleOptions => ({
    type: 'single',
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  }),
);
