import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../infra/prisma/prisma.module';
import { MessageRepository } from './message.repository';

@Module({
  imports: [PrismaModule],
  providers: [MessageRepository],
  exports: [MessageRepository],
})
export class MessageRepositoryModule {}
