import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { BlockedUserController } from './blocked-user.controller';
import { BlockedUserRepository } from './blocked-user.repository';
import { BlockedUserService } from './blocked-user.service';

@Module({
  imports: [PrismaModule],
  providers: [BlockedUserService, BlockedUserRepository],
  controllers: [BlockedUserController],
})
export class BlockedUserModule {}
