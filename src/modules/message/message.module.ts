import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MessageController } from './message.controller';
import { MessageRepository } from './message.repository';
import { MessageService } from './message.service';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
})
export class MessageModule {}
