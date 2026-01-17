import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChatRepository } from './chat.repository';

@Module({
  imports: [PrismaModule],
  providers: [ChatRepository],
  exports: [ChatRepository],
})
export class ChatRepositoryModule {}
