import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FileStorageModule } from '../../common/storage/storage.module';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { UserAvatarController } from './user-avatar/user-avatar.controller';
import { UserAvatarService } from './user-avatar/user-avatar.service';
import { UserCleanupService } from './user-cleanup.service';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    TokenModule,
    ChatModule,
    FileStorageModule,
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
