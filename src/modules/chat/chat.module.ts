import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { MessageModule } from '../message/message.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatMessageController } from './chat-message.controller';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule, MessageModule],
  controllers: [ChatController, ChatMessageController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService],
})
export class ChatModule {}
