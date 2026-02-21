import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { AvatarInterceptor } from '../../../common/interceptor/avatar.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { ChatAvatarService } from './chat-avatar.service';

@Controller('chats/:chatId')
@UseGuards(VerifiedUserGuard)
export class ChatAvatarController {
  constructor(private readonly chatAvatarService: ChatAvatarService) {}

  @Patch('avatar')
  @UseInterceptors(AvatarInterceptor)
  async updateMyAvatar(
    @Param('chatId') chatId: number,
    @CurrentUser() user: AccessTokenPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chatAvatarService.updateAvatar(chatId, user, file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyAvatar(
    @Param('chatId') chatId: number,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    return this.chatAvatarService.deleteAvatar(chatId, user);
  }
}
