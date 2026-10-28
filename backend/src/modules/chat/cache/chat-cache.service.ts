import { PaginationDto } from '../../../common/dto/pagination.dto';
import { RedisService } from '../../../infra/redis/redis.service';
import { PaginatedMyChats } from '../types/chat.types';

export class ChatCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getMyChats(userId: number, dto: PaginationDto) {
    return this.redisService.get<PaginatedMyChats>(
      this.buildMyChatsKey(userId, dto),
    );
  }

  async setMyChats(
    chats: PaginatedMyChats,
    userId: number,
    dto: PaginationDto,
  ): Promise<string | null> {
    return this.redisService.set(this.buildMyChatsKey(userId, dto), chats, 10);
  }

  buildMyChatsKey(userId: number, { cursor, limit }: PaginationDto) {
    return `chats:user:${userId}:cursor:${cursor ?? 'start'}:limit:${limit}`;
  }
}
