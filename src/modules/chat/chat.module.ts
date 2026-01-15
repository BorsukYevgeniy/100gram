import { Module } from '@nestjs/common';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ChatMessageController } from './chat-message/chat-message.controller';
import { ChatUserController } from './chat-user/chat-user.controller';
import { ChatUserService } from './chat-user/chat-user.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatValidationService } from './validation/chat-validation.service';

@Module({
  imports: [PrismaModule, TokenModule, MessageModule],
  controllers: [ChatMessageController, ChatUserController, ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatUserService,
    ChatValidationService,
    ChatRepository,
  ],
  exports: [ChatService],
})
export class ChatModule {}
