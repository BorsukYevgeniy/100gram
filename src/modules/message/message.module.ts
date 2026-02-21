import { Module } from '@nestjs/common';
import { ChatRepositoryModule } from '../chat/repository/chat-repository.module';
import { FileModule } from '../file/file.module';
import { ReactionModule } from '../reaction/reaction.module';
import { TokenModule } from '../token/token.module';
import { BlockedUserModule } from '../user/blocked-user/blocked-user.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageReactionController } from './reaction/message-reaction.controller';
import { MessageRepositoryModule } from './repository/message-repository.module';

@Module({
  imports: [
    BlockedUserModule,
    ChatRepositoryModule,
    MessageRepositoryModule,
    TokenModule,
    FileModule,
    ReactionModule,
  ],
  controllers: [MessageReactionController, MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
