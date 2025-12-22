import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '../../common/decorators/user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ChatService } from './chat.service';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createPrivateChat(
    @User() user: JwtPayload,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return await this.chatService.createPrivateChat(user.id, dto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.findById(id);
  }

  @Patch(':id')
  async updateGroupChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return this.chatService.updateGroupChat(id, updateChatDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.chatService.delete(id);
  }
}
