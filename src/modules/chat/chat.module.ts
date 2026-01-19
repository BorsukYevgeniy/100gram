import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../common/storage/storage.module';
import { MessageModule } from '../message/message.module';
import { TokenModule } from '../token/token.module';
import { ChatAvatarController } from './chat-avatar/chat-avatar.controller';
import { ChatAvatarService } from './chat-avatar/chat-avatar.service';
import { ChatMessageController } from './chat-message/chat-message.controller';
import { ChatUserController } from './chat-user/chat-user.controller';
import { ChatUserService } from './chat-user/chat-user.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatRepositoryModule } from './repository/chat-repository.module';
import { ChatValidationModule } from './validation/chat-validation.module';

@Module({
  imports: [
    ChatValidationModule,
    ChatRepositoryModule,
    TokenModule,
    FileStorageModule,
    MessageModule,
  ],
  controllers: [
    ChatMessageController,
    ChatUserController,
    ChatAvatarController,
    ChatController,
  ],
  providers: [ChatGateway, ChatService, ChatAvatarService, ChatUserService],
  exports: [ChatService],
})
export class ChatModule {}
