import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';

@Injectable()
export class FileStorage implements OnModuleInit {
  private readonly MESSAGE_FILE_DIR_PATH: string;
  private readonly USER_AVATAR_DIR_PATH: string;

  constructor() {
    this.MESSAGE_FILE_DIR_PATH = resolve(
      __dirname,
      '../../../../files/messages',
    );

    this.USER_AVATAR_DIR_PATH = resolve(
      __dirname,
      '../../../../files/avatars/users',
    );
  }

  async onModuleInit() {
    // Creating dirs for storing files if they didn't exist

    await Promise.all([
      mkdir(this.MESSAGE_FILE_DIR_PATH, { recursive: true }),
      mkdir(this.USER_AVATAR_DIR_PATH, { recursive: true }),
    ]);
  }

  async writeMessageFile(fileName: string, content: Buffer): Promise<void> {
    return writeFile(resolve(this.MESSAGE_FILE_DIR_PATH, fileName), content);
  }

  async unlinkMessageFiles(fileNames: string[]) {
    return await Promise.all(
      fileNames.map((name) =>
        unlink(resolve(this.MESSAGE_FILE_DIR_PATH, name)),
      ),
    );
  }

  async writeUserAvatar(fileName: string, content: Buffer) {
    return writeFile(resolve(this.USER_AVATAR_DIR_PATH, fileName), content);
  }

  async unlinkUserAvatar(fileName: string) {
    return unlink(resolve(this.USER_AVATAR_DIR_PATH, fileName));
  }
}
