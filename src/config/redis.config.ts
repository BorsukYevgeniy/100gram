import { RedisModuleOptions } from '@nestjs-modules/ioredis';
import { registerAs } from '@nestjs/config';

export default registerAs(
  'redis',
  (): RedisModuleOptions => ({
    type: 'single',
    url: process.env.REDIS_URL,
  }),
);
