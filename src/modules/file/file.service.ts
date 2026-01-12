import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileService {
  async createFiles(files: Express.Multer.File[]): Promise<string[]> {
    if (files.length === 0) return [];

    const dirPath = path.resolve('..', '..', '..', 'files');

    await fs.mkdir(dirPath, { recursive: true });

    const fileNames = [];

    const writePromises: Promise<void>[] = files.map((file) => {
      const fileExt = path.extname(file.originalname);

      const fileName = randomUUID().concat(fileExt);
      fileNames.push(fileName);

      return fs.writeFile(path.resolve(dirPath, fileName), file.buffer);
    });

    await Promise.all(writePromises);

    return fileNames;
  }
}
