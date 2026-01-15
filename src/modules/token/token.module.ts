import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenCleanupService } from './token-cleanup.service';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [PrismaModule, ConfigModule, JwtModule, ScheduleModule.forRoot()],
  providers: [TokenCleanupService, TokenService, TokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
