import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TokenService],
  controllers: [TokenController],
})
export class TokenModule {}
