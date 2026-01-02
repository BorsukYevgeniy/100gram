import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenModule } from '../token/token.module';
import { MessageController } from './message.controller';
import { MessageRepository } from './message.repository';
import { MessageService } from './message.service';
import { MessageGateway } from './message.gateway';

@Module({
  imports: [PrismaModule, TokenModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository, MessageGateway],
  exports: [MessageService],
})
export class MessageModule {}
