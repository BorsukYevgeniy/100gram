import { Module } from '@nestjs/common';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { ChatMessageController } from './chat-message.controller';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, TokenModule, MessageModule],
  controllers: [ChatController, ChatMessageController],
  providers: [ChatGateway, ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
