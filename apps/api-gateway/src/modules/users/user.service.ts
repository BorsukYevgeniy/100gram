import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_CLIENT } from './user.constant';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}

  getUserById(userId) {
    return this.userClient.send('user.getById', userId);
  }

  getMe(user) {
    return this.userClient.send('user.getById', user);
  }

  assignAdmin(userId) {
    return this.userClient.send('user.assignAdmin', userId);
  }
}
