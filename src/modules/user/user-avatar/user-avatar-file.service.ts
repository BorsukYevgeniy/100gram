import { Injectable, OnModuleInit } from '@nestjs/common';
import { resolve } from 'path';
import { LocalFileStorage } from '../../../infra/file/file.storage';

@Injectable()
export class UserAvatarFileService implements OnModuleInit {
  private USER_AVATAR_DIR_PATH: string = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'files',
    'avatars',
    'users',
  );

  constructor(private readonly fileStorage: LocalFileStorage) {}

  async onModuleInit() {
    await this.fileStorage.mkdir(this.USER_AVATAR_DIR_PATH);
  }

  async writeUserAvatar(fileName: string, content: Buffer) {
    return this.fileStorage.write(fileName, this.USER_AVATAR_DIR_PATH, content);
  }
  async unlinkUserAvatar(fileName: string) {
    return this.fileStorage.unlink(fileName, this.USER_AVATAR_DIR_PATH);
  }
}
