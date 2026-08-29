import { Module } from '@nestjs/common';
import { UserClientModule } from '../../common/client/user-client.module';
import { TokenModule } from '../token/token.module';
import { BlockedUserModule } from './blocked-user/blocked-user.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserClientModule, TokenModule, BlockedUserModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
