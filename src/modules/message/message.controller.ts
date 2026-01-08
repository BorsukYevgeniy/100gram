import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/user.decorator';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@Controller('message')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':id')
  findOne(
    @User() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.findById(user, messageId);
  }

  @Patch(':id')
  update(
    @User() user: AccessTokenPayload,
    @Param('id') messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    return this.messageService.update(user, messageId, updateMessageDto);
  }

  @Delete(':id')
  delete(
    @User() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.delete(user, messageId);
  }
}
