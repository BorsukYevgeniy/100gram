import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UsersModule {}
