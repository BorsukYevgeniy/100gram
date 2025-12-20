import { ConfigModule } from '@config';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma';

@Module({
  imports: [ConfigModule.forApi(), PrismaModule],
})
export class ApiModule {}
