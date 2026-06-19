import { Injectable, OnModuleInit } from '@nestjs/common';
import { resolve } from 'path';
import { LocalFileStorage } from '../../../infra/file/file.storage';

@Injectable()
export class ChatAvatarFileService implements OnModuleInit {
  private CHAT_AVATAR_DIR_PATH: string = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'files',
    'avatars',
    'chats',
  );

  constructor(private readonly fileStorage: LocalFileStorage) {}

  async onModuleInit() {
    await this.fileStorage.mkdir(this.CHAT_AVATAR_DIR_PATH);
  }

  async writeChatAvatar(fileName: string, content: Buffer) {
    return this.fileStorage.write(fileName, this.CHAT_AVATAR_DIR_PATH, content);
  }

  async unlinkChatAvatar(fileName: string) {
    return this.fileStorage.unlink(fileName, this.CHAT_AVATAR_DIR_PATH);
  }
}
