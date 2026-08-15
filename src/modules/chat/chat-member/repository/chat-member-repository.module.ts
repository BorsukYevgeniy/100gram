import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../infra/prisma/prisma.module';
import { ChatMemberRepository } from './chat-member.repository';

@Module({
  imports: [PrismaModule],
  providers: [ChatMemberRepository],
  exports: [ChatMemberRepository],
})
export class ChatMemberRepositoryModule {}
