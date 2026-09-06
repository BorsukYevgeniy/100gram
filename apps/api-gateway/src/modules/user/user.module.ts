import { Module } from '@nestjs/common';
import { FilesClientModule } from '../../common/client/files/files-client.module';
import { UserClientModule } from '../../common/client/user/user-client.module';
import { TokenModule } from '../token/token.module';
import { BlockedUserModule } from './blocked-user/blocked-user.module';
import { UserAvatarFileService } from './user-avatar/user-avatar-file.service';
import { UserAvatarController } from './user-avatar/user-avatar.controller';
import { UserAvatarService } from './user-avatar/user-avatar.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    UserClientModule,
    FilesClientModule,
    TokenModule,
    BlockedUserModule,
  ],
  controllers: [UserController, UserAvatarController],
  providers: [UserService, UserAvatarService, UserAvatarFileService],
  exports: [UserService],
})
export class UserModule {}
