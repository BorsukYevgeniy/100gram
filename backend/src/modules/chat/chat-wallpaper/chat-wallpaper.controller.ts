import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageInterceptor } from '../../../common/interceptor/image.interceptor';
import { AccessTokenPayload } from '../../../common/types';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { ChatWallpaperService } from './chat-wallpaper.service';

@Controller('chat/:chatId/wallpaper')
@UseGuards(VerifiedUserGuard)
export class ChatWallpaperController {
  constructor(private readonly chatWallpaperService: ChatWallpaperService) {}

  @Patch()
  @UseInterceptors(ImageInterceptor('wallpaper'))
  async setWallpaper(
    @Param('chatId', ParseIntPipe) chatId: number,
    @UploadedFile() wallpaper: Express.Multer.File,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatWallpaperService.setWallpaper(
      chatId,
      wallpaper,
      currentUser,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWallpaper(
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatWallpaperService.removeWallpaper(currentUser, chatId);
  }
}
