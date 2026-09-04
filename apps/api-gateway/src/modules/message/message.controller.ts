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
import { AccessTokenPayload } from '@app/contracts/auth';
import { UpdateMessageDto } from '@app/contracts/message/dto';
import { Message } from '@app/contracts/message/types';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../auth/guard/verified-auth.guard';
import { MessageControllerDocs } from './docs/message-controller-docs.decorator';
import { MessageRoutesDocs } from './docs/message-routes-docs';
import { MessageService } from './message.service';

@MessageControllerDocs()
@Controller('messages')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @MessageRoutesDocs.GetById()
  @Get(':id')
  async getById(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.getById(messageId, user);
  }

  @MessageRoutesDocs.Update()
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

  @MessageRoutesDocs.Delete()
  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.delete(messageId, user);
  }
}
