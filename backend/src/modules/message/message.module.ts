import { Module } from '@nestjs/common';
import { ChatRepositoryModule } from '../chat/repository/chat-repository.module';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { FileModule } from '../file/file.module';
import { ReactionModule } from '../reaction/reaction.module';
import { TokenModule } from '../token/token.module';
import { MessageCacheModule } from './cache/message-cache.module';
import { MessageMapperModule } from './mapper/message-mapper.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageReactionController } from './reaction/message-reaction.controller';
import { MessageRepositoryModule } from './repository/message-repository.module';
import { MessageValidationModule } from './validation/message-validation.module';

@Module({
  imports: [
    MessageCacheModule,
    MessageRepositoryModule,
    MessageMapperModule,
    MessageValidationModule,
    ChatValidationModule,
    TokenModule,
    FileModule,
    ReactionModule,
    ChatRepositoryModule,
  ],
  controllers: [MessageReactionController, MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
