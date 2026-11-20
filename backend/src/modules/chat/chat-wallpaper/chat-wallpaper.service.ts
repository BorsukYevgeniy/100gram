import { ConflictException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatType, FileType } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { Wallpaper } from '../../../common/types/wallpaper.types';
import { FileService } from '../../file/file.service';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

@Injectable()
export class ChatWallpaperService {
  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly fileService: FileService,
    private readonly chatValidator: ChatValidationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChatWallpaperService.name);
  }

  async setWallpaper(
    chatId: number,
    wallpaperFile: Express.Multer.File,
    currentUser: AccessTokenPayload,
  ): Promise<Wallpaper> {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.GROUP,
      ChatType.CHANNEL,
    );
    await this.chatValidator.validateOwner(currentUser, chatId);

    let filename: string | undefined;
    try {
      // Save the wallpaper file using the FileService
      const [savedFilePath] = await this.fileService.createFiles(
        [wallpaperFile],
        FileType.CHAT_WALLPAPER,
      );

      filename = savedFilePath.name;

      await this.chatRepo.setWallpaper(chatId, filename);

      this.logger.info({ chatId, filename }, 'Updated chat wallpaper');

      return {
        wallpaperUrl: this.fileService.getFileUrl(
          filename,
          FileType.CHAT_WALLPAPER,
        ),
      };
    } catch (e) {
      this.logger.error({ e }, 'Failed to set wallpaper');
      if (filename) {
        await this.fileService.deleteFiles([filename], FileType.CHAT_WALLPAPER);
      }

      throw e;
    }
  }

  async removeWallpaper(currentUser: AccessTokenPayload, chatId: number) {
    await this.chatValidator.validateChatType(
      chatId,
      ChatType.GROUP,
      ChatType.CHANNEL,
    );
    await this.chatValidator.validateOwner(currentUser, chatId);

    const chat = await this.chatRepo.getById(chatId);

    if (!chat.wallpaperName) {
      this.logger.warn({ chatId }, 'Cannot delete default chat wallpaper');
      throw new ConflictException('Cannot delete default chat wallpaper');
    }

    await this.fileService.deleteFiles(
      [chat.wallpaperName],
      FileType.CHAT_WALLPAPER,
    );

    await this.chatRepo.removeWallpaper(chatId, chat.wallpaperName);

    this.logger.info({ chatId }, 'Deleted chat wallpaper');
  }
}
