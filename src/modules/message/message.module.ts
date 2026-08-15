import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { FileModule } from '../file/file.module';
import { ReactionModule } from '../reaction/reaction.module';
import { TokenModule } from '../token/token.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageReactionController } from './reaction/message-reaction.controller';
import { MessageRepositoryModule } from './repository/message-repository.module';
import { MessageValidationModule } from './validation/message-validation.module';

@Module({
  imports: [
    MessageRepositoryModule,
    TokenModule,
    FileModule,
    ReactionModule,
    MessageValidationModule,
    CacheModule,
    ChatValidationModule,
  ],
  controllers: [MessageReactionController, MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
