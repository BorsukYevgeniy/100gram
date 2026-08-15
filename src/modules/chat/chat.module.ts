import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../infra/file/storage.module';
import { CacheModule } from '../cache/cache.module';
import { ChatMemberRepositoryModule } from '../chat-member/repository/chat-member-repository.module';
import { MessageModule } from '../message/message.module';
import { TokenModule } from '../token/token.module';
import { ChatAvatarFileService } from './chat-avatar/chat-avatar-file.service';
import { ChatAvatarController } from './chat-avatar/chat-avatar.controller';
import { ChatAvatarService } from './chat-avatar/chat-avatar.service';
import { ChatMessageController } from './chat-message/chat-message.controller';
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
    FileStorageModule,
    MessageModule,
    CacheModule,
    ChatMemberRepositoryModule,
  ],
  controllers: [ChatMessageController, ChatAvatarController, ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatAvatarService,
    ChatAvatarFileService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
