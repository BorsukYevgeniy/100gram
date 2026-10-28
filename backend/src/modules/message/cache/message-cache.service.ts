import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { RedisService } from '../../../infra/redis/redis.service';
import { PaginatedMessageFilesReactionCount } from '../types/message.types';

@Injectable()
export class MessageCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getAllMessagesInChat(
    chatId: number,
    currentUserId: number,
    chatMessageVersion: number,
    dto: PaginationDto,
  ): Promise<PaginatedMessageFilesReactionCount | null> {
    return this.redisService.get<PaginatedMessageFilesReactionCount>(
      this.buildChatMessageKey(chatId, currentUserId, chatMessageVersion, dto),
    );
  }

  async setAllMessagesInChat(
    messages: PaginatedMessageFilesReactionCount,
    chatId: number,
    currentUserId: number,
    chatMessageVersion: number,
    dto: PaginationDto,
  ): Promise<string | null> {
    return this.redisService.set(
      this.buildChatMessageKey(chatId, currentUserId, chatMessageVersion, dto),
      messages,
      60,
    );
  }

  async getChatMessageVersion(chatId: number): Promise<number> {
    const versionKey = `chat:${chatId}:messages:version`;
    const version = await this.redisService.get<string>(versionKey);
    return version ? parseInt(version) : 0;
  }

  async incrChatMessageVersion(chatId: number): Promise<number> {
    const versionKey = `chat:${chatId}:messages:version`;

    await this.redisService.incr(versionKey);
    return this.redisService.expire(versionKey, 60);
  }

  buildChatMessageKey(
    chatId: number,
    userId: number,
    version: number,
    { cursor, limit }: PaginationDto,
  ): string {
    return `chat:${chatId}:messages:user:${userId}:v${version}:cursor:${cursor ?? 'start'}:limit:${limit}`;
  }
}
