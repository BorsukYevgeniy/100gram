import { Module } from '@nestjs/common';
import { ChatRepositoryModule } from '../../chat/repository/chat-repository.module';
import { MessageRepositoryModule } from '../repository/message-repository.module';
import { MessageValidationService } from './message-validation.service';

@Module({
  imports: [MessageRepositoryModule, ChatRepositoryModule],
  providers: [MessageValidationService],
  exports: [MessageValidationService],
})
export class MessageValidationModule {}
