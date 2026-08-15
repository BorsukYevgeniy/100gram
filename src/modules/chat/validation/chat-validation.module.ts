import { Module } from '@nestjs/common';
import { BlockedUserModule } from '../../user/blocked-user/blocked-user.module';
import { ChatMemberRepositoryModule } from '../chat-member/repository/chat-member-repository.module';
import { ChatRepositoryModule } from '../repository/chat-repository.module';
import { ChatValidationService } from './chat-validation.service';

@Module({
  imports: [
    BlockedUserModule,
    ChatRepositoryModule,
    ChatMemberRepositoryModule,
  ],
  providers: [ChatValidationService],
  exports: [ChatValidationService],
})
export class ChatValidationModule {}
