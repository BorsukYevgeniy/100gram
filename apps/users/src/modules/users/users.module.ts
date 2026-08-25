import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { UserRepository } from './user.repository';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UsersModule {}
