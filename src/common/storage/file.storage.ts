import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { PinoLogger } from 'nestjs-pino';
import { resolve } from 'path';

@Injectable()
export class FileStorage implements OnModuleInit {
  private readonly MESSAGE_FILE_DIR_PATH: string;
  private readonly USER_AVATAR_DIR_PATH: string;
  private readonly CHAT_AVATAR_DIR_PATH: string;

  constructor(private readonly logger: PinoLogger) {
    this.MESSAGE_FILE_DIR_PATH = resolve(
      __dirname,
      '../../../../files/messages',
    );

    this.USER_AVATAR_DIR_PATH = resolve(
      __dirname,
      '../../../../files/avatars/users',
    );

    this.CHAT_AVATAR_DIR_PATH = resolve(
      __dirname,
      '../../../../files/avatars/chats',
    );

    this.logger.setContext(FileStorage.name);
  }

  async onModuleInit() {
    // Creating dirs for storing files if they didn't exist

    this.logger.debug(
      {
        MESSAGE_FILE_DIR_PATH: this.MESSAGE_FILE_DIR_PATH,
        USER_AVATAR_DIR_PATH: this.USER_AVATAR_DIR_PATH,
      },
      'Creating directories for storing files',
    );

    try {
      await Promise.all([
        mkdir(this.MESSAGE_FILE_DIR_PATH, { recursive: true }),
        mkdir(this.USER_AVATAR_DIR_PATH, { recursive: true }),
      ]);
    } catch (e) {
      this.logger.fatal('Cannot create directories for storing files');

      throw e;
    }
  }

  async writeMessageFile(fileName: string, content: Buffer): Promise<void> {
    await writeFile(resolve(this.MESSAGE_FILE_DIR_PATH, fileName), content);
    this.logger.debug({ fileName }, 'File written');
  }

  async unlinkMessageFiles(fileNames: string[]) {
    await Promise.all(
      fileNames.map((name) =>
        unlink(resolve(this.MESSAGE_FILE_DIR_PATH, name)),
      ),
    );

    this.logger.debug({ fileNames }, 'Files deleted');
  }

  async writeUserAvatar(fileName: string, content: Buffer) {
    await writeFile(resolve(this.USER_AVATAR_DIR_PATH, fileName), content);
    this.logger.debug({ fileName }, 'User avatar written');
  }

  async unlinkUserAvatar(fileName: string) {
    await unlink(resolve(this.USER_AVATAR_DIR_PATH, fileName));
    this.logger.debug({ fileName }, 'User avatar deleted');
  }

  async writeChatAvatar(fileName: string, content: Buffer) {
    await writeFile(resolve(this.USER_AVATAR_DIR_PATH, fileName), content);
    this.logger.debug({ fileName }, 'User avatar written');
  }

  async unlinkChatAvatar(fileName: string) {
    await unlink(resolve(this.USER_AVATAR_DIR_PATH, fileName));
    this.logger.debug({ fileName }, 'User avatar deleted');
  }
}
