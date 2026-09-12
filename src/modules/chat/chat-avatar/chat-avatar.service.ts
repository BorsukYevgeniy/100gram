import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ChatType, FileType } from '../../../../generated/prisma/enums';
import { AccessTokenPayload } from '../../../common/types';
import { Avatar } from '../../../common/types/avatar.types';
import { FileService } from '../../file/file.service';
import { ChatRepository } from '../repository/chat.repository';
import { ChatValidationService } from '../validation/chat-validation.service';

@Injectable()
export class ChatAvatarService {
  constructor(
    private readonly fileService: FileService,
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

    let newAvatarName: string;
    try {
      const [{ name }] = await this.fileService.createFiles(
        [file],
        FileType.CHAT_AVATAR,
      );

      newAvatarName = name;
      await this.chatRepo.updateAvatar(chatId, newAvatarName);

      this.logger.info({ chatId, newAvatarName }, 'Updated chat avatar');

      return { avatarUrl: '/avatars/chats/'.concat(newAvatarName) };
    } catch (e) {
      await this.fileService.deleteFiles([newAvatarName], FileType.CHAT_AVATAR);
      throw e;
    }
  }

  async deleteAvatar(chatId: number, user: AccessTokenPayload) {
    await this.chatValidator.validateChatType(chatId, ChatType.GROUP);
    await this.chatValidator.validateOwner(user, chatId);

    const chat = await this.chatRepo.getById(chatId);

    if (!chat.avatarName) {
      this.logger.warn({ chatId }, 'Cannot delete default chat avatar ');
      throw new BadRequestException('Cannot delete default chat avatar');
    }

    await this.fileService.deleteFiles([chat.avatarName], FileType.CHAT_AVATAR);
    await this.chatRepo.deleteAvatar(chatId);

    this.logger.info({ chatId }, 'Deleted chat avatar');
  }
}
