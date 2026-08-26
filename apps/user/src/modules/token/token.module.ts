import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import jwtConfig from '../../config/jwt.config';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { TokenController } from './token.controller';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule,
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [TokenService, TokenRepository],
  controllers: [TokenController],
})
export class TokenModule {}
