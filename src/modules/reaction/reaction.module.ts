import { Module } from '@nestjs/common';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { MessageRepositoryModule } from '../message/repository/message-repository.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReactionRepository } from './reaction.repository';
import { ReactionService } from './reaction.service';

@Module({
  imports: [MessageRepositoryModule, ChatValidationModule, PrismaModule],
  providers: [ReactionService, ReactionRepository],
  exports: [ReactionService],
})
export class ReactionModule {}
