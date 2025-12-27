import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenRepository } from './token.repository';
import { TokenService } from './token.service';

@Module({
  imports: [PrismaModule, ConfigModule, JwtModule],
  providers: [TokenService, TokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
