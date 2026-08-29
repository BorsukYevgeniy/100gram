import { Module } from '@nestjs/common';
import { BlockedUserController } from './blocked-user.controller';
import { BlockedUserRepository } from './blocked-user.repository';
import { BlockedUserService } from './blocked-user.service';

@Module({
  providers: [BlockedUserService, BlockedUserRepository],
  controllers: [BlockedUserController],
})
export class BlockedUserModule {}
