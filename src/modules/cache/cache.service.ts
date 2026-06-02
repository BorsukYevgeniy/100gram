import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';

import Redis from 'ioredis';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set(key: string, value: any, ttl: number): Promise<string | null> {
    return this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async getChatMessageVersion(chatId: number): Promise<number> {
    const versionKey = `chat:${chatId}:messages:version`;
    const version = await this.redisClient.get(versionKey);
    return version ? parseInt(version) : 0;
  }

  async incrChatMessageVersion(chatId: number): Promise<number> {
    const versionKey = `chat:${chatId}:messages:version`;

    await this.redisClient.incr(versionKey);
    return await this.redisClient.expire(versionKey, 60);
  }

  buildChatMessageLKey(
    chatId: number,
    version: number,
    { cursor, limit }: PaginationDto,
  ): string {
    return `chat:${chatId}:messages:v${version}:cursor:${cursor ?? 'start'}:limit:${limit}`;
  }
}
