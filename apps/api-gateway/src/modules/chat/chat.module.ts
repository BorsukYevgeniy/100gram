import { Module } from '@nestjs/common';
import { ChatClientModule } from '../../common/client/chat/chat-client.module';
import { TokenModule } from '../token/token.module';
import { ChatMemberController } from './chat-members/chat-member.controller';
import { ChatMemberService } from './chat-members/chat-member.service';
import { ChatMessageController } from './chat-messages/chat-messages.controller';
import { ChatMessagesService } from './chat-messages/chat-messages.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [ChatClientModule, TokenModule],
  providers: [ChatService, ChatMessagesService, ChatMemberService],
  controllers: [ChatController, ChatMessageController, ChatMemberController],
})
export class ChatModule {}
