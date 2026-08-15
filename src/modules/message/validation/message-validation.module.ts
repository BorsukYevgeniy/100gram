import { Module } from '@nestjs/common';
import { ChatUserRepositoryModule } from '../../chat/chat-user/repository/chat-user-repository.module';
import { MessageRepositoryModule } from '../repository/message-repository.module';
import { MessageValidationService } from './message-validation.service';

@Module({
  imports: [MessageRepositoryModule, ChatUserRepositoryModule],
  providers: [MessageValidationService],
  exports: [MessageValidationService],
})
export class MessageValidationModule {}
