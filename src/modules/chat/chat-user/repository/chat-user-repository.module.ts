import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../infra/prisma/prisma.module';
import { ChatUserRepository } from './chat-user.repository';

@Module({
  imports: [PrismaModule],
  providers: [ChatUserRepository],
  exports: [ChatUserRepository],
})
export class ChatUserRepositoryModule {}
