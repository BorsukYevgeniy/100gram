import { Module } from '@nestjs/common';
import { ChatUserRepositoryModule } from '../chat-user/repository/chat-user-repository.module';
import { ChatRepositoryModule } from '../repository/chat-repository.module';
import { ChatValidationService } from './chat-validation.service';

@Module({
  imports: [ChatRepositoryModule, ChatUserRepositoryModule],
  providers: [ChatValidationService],
  exports: [ChatValidationService],
})
export class ChatValidationModule {}
