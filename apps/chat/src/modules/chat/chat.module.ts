import { Module } from '@nestjs/common';
import { UserClientModule } from '../../common/client/user-client.module';
import { MessageModule } from '../message/message.module';
import { ChatMemberController } from './chat-member/chat-member.controller';
import { ChatMemberService } from './chat-member/chat-member.service';
import { ChatMemberRepositoryModule } from './chat-member/repository/chat-member-repository.module';
import { ChatMessageController } from './chat-message/chat-message.controller';
import { ChatMessageService } from './chat-message/chat-message.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepositoryModule } from './repository/chat-repository.module';
import { ChatValidationModule } from './validation/chat-validation.module';
// import { ChatGateway } from './ws/chat.gateway';

@Module({
  imports: [
    ChatValidationModule,
    ChatRepositoryModule,
    // FileStorageModule,
    MessageModule,
    // CacheModule,
    ChatMemberRepositoryModule,
    UserClientModule,
  ],
  controllers: [
    ChatMemberController,
    ChatMessageController,
    // ChatAvatarController,
    ChatController,
  ],
  providers: [
    // ChatGateway,
    ChatService,
    // ChatAvatarService,
    // ChatAvatarFileService,
    ChatMemberService,
    ChatMessageService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
