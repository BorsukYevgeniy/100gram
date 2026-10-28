import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);

    return value ? JSON.parse(value) : null;
  }

  async set(
    key: string,
    value: any,
    ttlInSeconds: number,
  ): Promise<string | null> {
    return this.redisClient.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async expire(key: string, ttlInSeconds: number): Promise<number> {
    return this.redisClient.expire(key, ttlInSeconds);
  }
}
