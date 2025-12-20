import { ConfigModule } from '@config';
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule.forBase()],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
