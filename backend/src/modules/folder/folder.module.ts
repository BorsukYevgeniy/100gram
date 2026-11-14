import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { ChatValidationModule } from '../chat/validation/chat-validation.module';
import { TokenModule } from '../token/token.module';
import { FolderController } from './folder.controller';
import { FolderRepository } from './folder.repository';
import { FolderService } from './folder.service';

@Module({
  imports: [PrismaModule, TokenModule, ChatValidationModule],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
})
export class FolderModule {}
