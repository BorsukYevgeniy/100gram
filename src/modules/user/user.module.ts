import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { UserAvatarController } from './avatar/user-avatar.controller';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserScheduler } from './user.scheduler';
import { UserService } from './user.service';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, TokenModule, ChatModule],
  controllers: [UserController, UserAvatarController],
  providers: [UserScheduler, UserService, UserAvatarController, UserRepository],
  exports: [UserService],
})
export class UserModule {}
