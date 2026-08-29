import { Module } from '@nestjs/common';
import { UserClientModule } from '../../common/client/user-client.module';
import { TokenService } from './token.service';

@Module({
  imports: [UserClientModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
