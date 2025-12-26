import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Message } from '../../../generated/prisma/client';
import { User } from '../../common/decorators/user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@Controller('message')
@UseGuards(AuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':id')
  async findOne(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ): Promise<Message> {
    return await this.messageService.findById(user, messageId);
  }

  @Patch(':id')
  async update(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    return await this.messageService.update(user, messageId, updateMessageDto);
  }

  @Delete(':id')
  async delete(
    @User() user: JwtPayload,
    @Param('id', ParseIntPipe) messageId: number,
  ): Promise<Message> {
    return await this.messageService.delete(user, messageId);
  }
}
