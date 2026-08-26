import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from './user.service';

@Injectable()
export class UserCleanupService {
  constructor(private readonly userService: UserService) {}

  @Cron('0 0 */3 * *')
  async deleteUnverifiedUsers() {
    return await this.userService.deleteUnverifiedUsers();
  }
}
