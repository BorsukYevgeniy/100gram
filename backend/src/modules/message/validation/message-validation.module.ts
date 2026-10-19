import { Module } from '@nestjs/common';
import { ChatMemberRepositoryModule } from '../../chat/chat-member/repository/chat-member-repository.module';
import { MessageMapperModule } from '../mapper/message-mapper.module';
import { MessageRepositoryModule } from '../repository/message-repository.module';
import { MessageValidationService } from './message-validation.service';

@Module({
  imports: [
    MessageRepositoryModule,
    ChatMemberRepositoryModule,
    MessageMapperModule,
  ],
  providers: [MessageValidationService],
  exports: [MessageValidationService],
})
export class MessageValidationModule {}
