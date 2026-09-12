import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { ChatMemberRepositoryModule } from '../chat/chat-member/repository/chat-member-repository.module';
import { ChatModule } from '../chat/chat.module';
import { FileModule } from '../file/file.module';
import { TokenModule } from '../token/token.module';
import { BlockedUserModule } from './blocked-user/blocked-user.module';
import { UserAvatarController } from './user-avatar/user-avatar.controller';
import { UserAvatarService } from './user-avatar/user-avatar.service';
import { UserCleanupService } from './user-cleanup.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChatMemberRepositoryModule,
    PrismaModule,
    TokenModule,
    ChatModule,
    BlockedUserModule,
    FileModule,
  ],
  controllers: [UserAvatarController, UserController],
  providers: [
    UserCleanupService,
    UserService,
    UserAvatarService,
    UserRepository,
  ],
  exports: [UserService],
})
export class UserModule {}
