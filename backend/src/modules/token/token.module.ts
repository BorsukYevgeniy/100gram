import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import jwtConfig from '../../config/jwt.config';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { TokenCleanupService } from './token-cleanup.service';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule,
    ScheduleModule.forRoot(),
  ],
  providers: [TokenCleanupService, TokenService, TokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
