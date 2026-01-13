import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';

@Injectable()
export class FileStorage implements OnModuleInit {
  private readonly DIR_PATH: string;
  constructor() {
    this.DIR_PATH = resolve(__dirname, '../../../../files');
  }

  async onModuleInit() {
    // Creating dir for storing files if she didn't exist
    await mkdir(this.DIR_PATH, { recursive: true });
  }

  async writeFiles(fileName: string, content: Buffer): Promise<void> {
    return writeFile(resolve(this.DIR_PATH, fileName), content);
  }

  async unlinkFiles(fileNames: string[]) {
    return await Promise.all(
      fileNames.map((name) => unlink(resolve(this.DIR_PATH, name))),
    );
  }
}
