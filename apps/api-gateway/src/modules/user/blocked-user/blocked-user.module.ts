import { Module } from '@nestjs/common';
import { UserClientModule } from '../../../common/client/user-client.module';
import { TokenModule } from '../../token/token.module';
import { BlockedUserController } from './blocked-user.controller';
import { BlockedUserService } from './blocked-user.service';

@Module({
  imports: [UserClientModule, TokenModule],
  providers: [BlockedUserService],
  controllers: [BlockedUserController],
})
export class BlockedUserModule {}
