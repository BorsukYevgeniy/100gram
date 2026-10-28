import { Injectable } from '@nestjs/common';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { RedisService } from '../../../infra/redis/redis.service';
import { SearchUserDto } from '../dto/search-user.dto';
import { PaginatedUserNoCredOtpVCode } from '../types/user.types';

@Injectable()
export class UserCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getSearchedUsers(
    dto: SearchUserDto,
    paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode | null> {
    return this.redisService.get<PaginatedUserNoCredOtpVCode>(
      this.buildSearchUsersKey(dto, paginationDto),
    );
  }

  async setSearchedUsers(
    users: PaginatedUserNoCredOtpVCode,
    dto: SearchUserDto,
    paginationDto: PaginationDto,
  ): Promise<string | null> {
    return this.redisService.set(
      this.buildSearchUsersKey(dto, paginationDto),
      users,
      60,
    );
  }

  buildSearchUsersKey(dto: SearchUserDto, { cursor, limit }: PaginationDto) {
    return `users:search:nickname${dto.nickname}:cursor:${cursor}:limit:${limit}`;
  }
}
