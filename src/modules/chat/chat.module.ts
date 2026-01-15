import { Module } from '@nestjs/common';
import { FileStorageModule } from '../../common/storage/storage.module';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ChatAvatarController } from './avatar/chat-avatar.controller';
import { ChatAvatarService } from './avatar/chat-avatar.service';
import { ChatMessageController } from './chat-message/chat-message.controller';
import { ChatUserController } from './chat-user/chat-user.controller';
import { ChatUserService } from './chat-user/chat-user.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatValidationService } from './validation/chat-validation.service';

@Module({
  imports: [PrismaModule, TokenModule, FileStorageModule, MessageModule],
  controllers: [
    ChatMessageController,
    ChatUserController,
    ChatAvatarController,
    ChatController,
  ],
  providers: [
    ChatGateway,
    ChatService,
    ChatAvatarService,
    ChatUserService,
    ChatValidationService,
    ChatRepository,
  ],
  exports: [ChatService],
})
export class ChatModule {}
