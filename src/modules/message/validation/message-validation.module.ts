import { Module } from '@nestjs/common';
import { ChatMemberRepositoryModule } from '../../chat-member/repository/chat-member-repository.module';
import { MessageRepositoryModule } from '../repository/message-repository.module';
import { MessageValidationService } from './message-validation.service';

@Module({
  imports: [MessageRepositoryModule, ChatMemberRepositoryModule],
  providers: [MessageValidationService],
  exports: [MessageValidationService],
})
export class MessageValidationModule {}
