import { Module } from '@nestjs/common';
import { ConfigModule } from '../../modules/config/config.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
