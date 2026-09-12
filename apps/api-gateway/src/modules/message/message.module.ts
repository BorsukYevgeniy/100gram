import { Module } from '@nestjs/common';
import { ChatClientModule } from '../../common/client/chat/chat-client.module';
import { FilesClientModule } from '../../common/client/files/files-client.module';
import { TokenModule } from '../token/token.module';
import { MessageReactionController } from './message-reaction/message-reaction.controller';
import { MessageReactionService } from './message-reaction/message-reaction.service';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [ChatClientModule, TokenModule, FilesClientModule],
  providers: [MessageService, MessageReactionService],
  controllers: [MessageController, MessageReactionController],
})
export class MessageModule {}
