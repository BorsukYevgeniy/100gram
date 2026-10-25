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
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { MessageControllerDocs } from './docs/message-controller-docs.decorator';
import { MessageRoutesDocs } from './docs/message-routes-docs';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';
import { MessageFiles } from './types/message.types';

@MessageControllerDocs()
@Controller('messages')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessageRoutesDocs.GetById()
  @Get(':messageId')
  async findOne(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
  ): Promise<MessageFiles> {
    return this.messageService.findById(id, messageId);
  }

  @MessageRoutesDocs.Update()
  @Patch(':messageId')
  @UseInterceptors(MessageFilesInterceptor)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<MessageFiles> {
    return this.messageService.update(user, messageId, updateMessageDto, files);
  }

  @MessageRoutesDocs.Delete()
  @Delete(':messageId')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
  ): Promise<MessageFiles> {
    return this.messageService.delete(user, messageId);
  }

  @MessageRoutesDocs.Pin()
  @Patch(':messageId/pin')
  async pinMessage(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.pinMessage(id, messageId);
  }

  @MessageRoutesDocs.Unpin()
  @Patch(':messageId/unpin')
  async unpinMessage(
    @CurrentUser() { userId: id }: AccessTokenPayload,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.messageService.unpinMessage(id, messageId);
  }
}
