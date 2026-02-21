import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@Controller('messages')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.findById(user, messageId);
  }

  @Patch(':id')
  @UseInterceptors(MessageFilesInterceptor)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    return this.messageService.update(user, messageId, updateMessageDto, files);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.delete(user, messageId);
  }
}
