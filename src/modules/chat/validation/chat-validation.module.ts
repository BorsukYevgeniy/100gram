import { Module } from '@nestjs/common';
import { ChatRepositoryModule } from '../repository/chat-repository.module';
import { ChatValidationService } from './chat-validation.service';

@Module({
  imports: [ChatRepositoryModule],
  providers: [ChatValidationService],
  exports: [ChatValidationService],
})
export class ChatValidationModule {}
