import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TokenModule } from '../../token/token.module';
import { BlockedUserController } from './blocked-user.controller';
import { BlockedUserRepository } from './blocked-user.repository';
import { BlockedUserService } from './blocked-user.service';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [BlockedUserController],
  providers: [BlockedUserService, BlockedUserRepository],
  exports: [BlockedUserService],
})
export class BlockedUserModule {}
