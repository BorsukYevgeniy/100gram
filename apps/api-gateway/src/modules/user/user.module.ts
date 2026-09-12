import { Module } from '@nestjs/common';
import { UserClientModule } from '../../common/client/user/user-client.module';
import { FilesModule } from '../files/files.module';
import { TokenModule } from '../token/token.module';
import { BlockedUserModule } from './blocked-user/blocked-user.module';
import { UserAvatarController } from './user-avatar/user-avatar.controller';
import { UserAvatarService } from './user-avatar/user-avatar.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserClientModule, FilesModule, TokenModule, BlockedUserModule],
  controllers: [UserController, UserAvatarController],
  providers: [UserService, UserAvatarService],
  exports: [UserService],
})
export class UserModule {}
