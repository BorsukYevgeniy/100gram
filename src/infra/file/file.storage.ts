import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { PinoLogger } from 'nestjs-pino';
import { resolve } from 'path';

@Injectable()
export class FileStorage implements OnModuleInit {
  private MESSAGE_FILE_DIR_PATH: string;
  private USER_AVATAR_DIR_PATH: string;
  private CHAT_AVATAR_DIR_PATH: string;

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
        CHAT_AVATAR_DIR_PATH: this.CHAT_AVATAR_DIR_PATH,
      },
      'Creating directories for storing files',
    );

    try {
      await Promise.all([
        mkdir(this.MESSAGE_FILE_DIR_PATH, { recursive: true }),
        mkdir(this.USER_AVATAR_DIR_PATH, { recursive: true }),
        mkdir(this.CHAT_AVATAR_DIR_PATH, { recursive: true }),
      ]);
    } catch (e) {
      this.logger.fatal(
        {
          MESSAGE_FILE_DIR_PATH: this.MESSAGE_FILE_DIR_PATH,
          USER_AVATAR_DIR_PATH: this.USER_AVATAR_DIR_PATH,
          CHAT_AVATAR_DIR_PATH: this.CHAT_AVATAR_DIR_PATH,
        },
        'Cannot create directories for storing files',
      );

      throw e;
    }
  }

  async writeMessageFile(fileName: string, content: Buffer): Promise<void> {
    try {
      await writeFile(resolve(this.MESSAGE_FILE_DIR_PATH, fileName), content);
      this.logger.debug({ fileName }, 'File written');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot write file');
      await unlink(resolve(this.MESSAGE_FILE_DIR_PATH, fileName));
      throw e;
    }
  }

  async unlinkMessageFiles(fileNames: string[]) {
    try {
      await Promise.all(
        fileNames.map((name) =>
          unlink(resolve(this.MESSAGE_FILE_DIR_PATH, name)),
        ),
      );

      this.logger.debug({ fileNames }, 'Files deleted');
    } catch (e) {
      this.logger.error({ fileNames }, 'Cannot delete files');
      throw e;
    }
  }

  async writeUserAvatar(fileName: string, content: Buffer) {
    try {
      await writeFile(resolve(this.USER_AVATAR_DIR_PATH, fileName), content);
      this.logger.debug({ fileName }, 'User avatar written');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot write user avatar');
      await unlink(resolve(this.USER_AVATAR_DIR_PATH, fileName));
      throw e;
    }
  }

  async unlinkUserAvatar(fileName: string) {
    try {
      await unlink(resolve(this.USER_AVATAR_DIR_PATH, fileName));
      this.logger.debug({ fileName }, 'User avatar deleted');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot delete user avatar');
      throw e;
    }
  }

  async writeChatAvatar(fileName: string, content: Buffer) {
    try {
      await writeFile(resolve(this.CHAT_AVATAR_DIR_PATH, fileName), content);
      this.logger.debug({ fileName }, 'Chat avatar written');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot write chat avatar');
      await unlink(resolve(this.CHAT_AVATAR_DIR_PATH, fileName));
      throw e;
    }
  }

  async unlinkChatAvatar(fileName: string) {
    try {
      await unlink(resolve(this.CHAT_AVATAR_DIR_PATH, fileName));
      this.logger.debug({ fileName }, 'Chat avatar deleted');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot delete chat avatar');
      throw e;
    }
  }
}
