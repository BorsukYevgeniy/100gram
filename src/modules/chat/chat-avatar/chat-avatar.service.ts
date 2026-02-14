import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { extname } from 'path';
import { ChatType } from '../../../../generated/prisma/enums';
import { FileStorage } from '../../../common/storage/file.storage';
import { AccessTokenPayload } from '../../../common/types';
import { Avatar } from '../../../common/types/avatar.types';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

@Injectable()
export class ChatAvatarService {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly logger: PinoLogger,
    private readonly chatRepo: ChatRepository,
    private readonly chatValidator: ChatValidationService,
  ) {
    this.logger.setContext(ChatAvatarService.name);
  }

  async updateAvatar(
    chatId: number,
    user: AccessTokenPayload,
    file: Express.Multer.File,
  ): Promise<Avatar> {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(user, chatId);

    const newAvatarName = randomUUID().concat(extname(file.originalname));
    try {
      await this.fileStorage.writeChatAvatar(newAvatarName, file.buffer);
      await this.chatRepo.updateAvatar(chatId, newAvatarName);

      this.logger.info({ chatId, newAvatarName }, 'Updated chat avatar');

      return { avatarUrl: '/avatars/chats/'.concat(newAvatarName) };
    } catch (e) {
      await this.fileStorage.unlinkChatAvatar(newAvatarName);
      throw e;
    }
  }

  async deleteAvatar(chatId: number, user: AccessTokenPayload) {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(user, chatId);

    const chat = await this.chatRepo.getById(chatId);

    if (!chat.avatar) {
      this.logger.warn({ chatId }, 'Cannot delete default chat avatar ');
      throw new BadRequestException('Cannot delete default chat avatar');
    }

    await this.fileStorage.unlinkChatAvatar(chat.avatar);
    await this.chatRepo.updateAvatar(chatId);

    this.logger.info({ chatId }, 'Deleted chat avatar');
  }
}
