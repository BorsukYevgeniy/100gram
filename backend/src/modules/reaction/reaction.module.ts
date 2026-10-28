import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { MessageCacheModule } from '../message/cache/message-cache.module';
import { MessageRepositoryModule } from '../message/repository/message-repository.module';
import { ReactionRepository } from './reaction.repository';
import { ReactionService } from './reaction.service';

@Module({
  imports: [
    MessageRepositoryModule,
    ChatValidationModule,
    PrismaModule,
    MessageCacheModule,
  ],
  providers: [ReactionService, ReactionRepository],
  exports: [ReactionService],
})
export class ReactionModule {}
