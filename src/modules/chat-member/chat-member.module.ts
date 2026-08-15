import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { TokenModule } from '../token/token.module';
import { ChatMemberController } from './chat-member.controller';
import { ChatMemberService } from './chat-member.service';
import { ChatMemberRepositoryModule } from './repository/chat-member-repository.module';

@Module({
  imports: [
    PrismaModule,
    ChatMemberRepositoryModule,
    ChatValidationModule,
    TokenModule,
  ],
  providers: [ChatMemberService],
  controllers: [ChatMemberController],
})
export class ChatMemberModule {}
