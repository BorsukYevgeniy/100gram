import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from './user.service';

@Injectable()
export class UserScheduler {
  constructor(private readonly userService: UserService) {}

  @Cron('0 0 */3 * *')
  deleteUnverifiedUsers() {
    return this.userService.deleteUnverifiedUsers();
  }
}
