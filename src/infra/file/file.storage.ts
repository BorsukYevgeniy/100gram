import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { PinoLogger } from 'nestjs-pino';
import { resolve } from 'path';

@Injectable()
export class LocalFileStorage {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LocalFileStorage.name);
  }

  async write(fileName: string, path: string, content: Buffer) {
    try {
      await writeFile(resolve(path, fileName), content);
      this.logger.debug({ fileName, path }, 'File written');
    } catch (e) {
      this.logger.error({ fileName, path }, 'Cannot write file');
      throw e;
    }
  }

  async unlink(fileName: string, path: string) {
    try {
      await unlink(resolve(path, fileName));
      this.logger.debug({ fileName }, 'File deleted');
    } catch (e) {
      this.logger.error({ fileName }, 'Cannot delete file');
      throw e;
    }
  }

  async mkdir(path: string) {
    try {
      await mkdir(path, { recursive: true });
      this.logger.debug({ path }, 'Directory created');
    } catch (e) {
      this.logger.fatal({ path }, 'Cannot create directory');
    }
  }
}
