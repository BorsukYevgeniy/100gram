import { Module } from '@nestjs/common';
import { ChatMemberRepositoryModule } from '../../chat-member/repository/chat-member-repository.module';
import { ChatRepositoryModule } from '../repository/chat-repository.module';
import { ChatValidationService } from './chat-validation.service';

@Module({
  imports: [ChatRepositoryModule, ChatMemberRepositoryModule],
  providers: [ChatValidationService],
  exports: [ChatValidationService],
})
export class ChatValidationModule {}
