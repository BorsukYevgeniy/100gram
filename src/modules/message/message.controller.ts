import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { MessageControllerDocs } from './docs/message-controller-docs.decorator';
import { MessageRoutesDocs } from './docs/message-routes-docs';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@MessageControllerDocs()
@Controller('messages')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessageRoutesDocs.GetById()
  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ): Promise<Message> {
    return this.messageService.findById(user, messageId);
  }

  @MessageRoutesDocs.Update()
  @Patch(':id')
  @UseInterceptors(MessageFilesInterceptor)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    return this.messageService.update(user, messageId, updateMessageDto, files);
  }

  @MessageRoutesDocs.Delete()
  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ): Promise<Message> {
    return this.messageService.delete(user, messageId);
  }

  @MessageRoutesDocs.Pin()
  @Patch(':id/pin')
  async pinMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.pinMessage(user, messageId);
  }

  @MessageRoutesDocs.Unpin()
  @Patch(':id/unpin')
  async unpinMessage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.unpinMessage(user, messageId);
  }
}
