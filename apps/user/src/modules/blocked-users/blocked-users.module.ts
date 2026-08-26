import { Module } from '@nestjs/common';
import { BlockedUserController } from './blocked-users.controller';
import { BlockedUserService } from './blocked-users.service';

@Module({
  providers: [BlockedUserService],
  controllers: [BlockedUserController],
})
export class BlockedUserModule {}
