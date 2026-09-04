import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageReactionController } from './message-reaction/message-reaction.controller';
import { MessageReactionService } from './message-reaction/message-reaction.service';

@Module({
  providers: [MessageService, MessageReactionService],
  controllers: [MessageController, MessageReactionController]
})
export class MessageModule {}
