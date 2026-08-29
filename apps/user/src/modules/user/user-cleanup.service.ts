import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRepository } from './user.repository';

@Injectable()
export class UserCleanupService {
  constructor(private readonly userRepo: UserRepository) {}

  @Cron('0 0 */3 * *')
  async deleteUnverifiedUsers() {
    return await this.userRepo.deleteUnverifiedUsers();
  }
}
