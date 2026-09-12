import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { FileModule } from '../file/file.module';
import { MessageModule } from '../message/message.module';
import { TokenModule } from '../token/token.module';
import { ChatAvatarController } from './chat-avatar/chat-avatar.controller';
import { ChatAvatarService } from './chat-avatar/chat-avatar.service';
import { ChatMemberController } from './chat-member/chat-member.controller';
import { ChatMemberService } from './chat-member/chat-member.service';
import { ChatMemberRepositoryModule } from './chat-member/repository/chat-member-repository.module';
import { ChatMessageController } from './chat-message/chat-message.controller';
import { ChatMessageService } from './chat-message/chat-message.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepositoryModule } from './repository/chat-repository.module';
import { ChatValidationModule } from './validation/chat-validation.module';
import { ChatGateway } from './ws/chat.gateway';

@Module({
  imports: [
    ChatValidationModule,
    ChatRepositoryModule,
    TokenModule,
    FileModule,
    MessageModule,
    CacheModule,
    ChatMemberRepositoryModule,
  ],
  controllers: [
    ChatMemberController,
    ChatMessageController,
    ChatAvatarController,
    ChatController,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatAvatarService,
    ChatMemberService,
    ChatMessageService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
