import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'node:path';

export const ImageInterceptor = (fieldName: string) =>
  FileInterceptor(fieldName, {
    limits: {
      fileSize: 7 * 1024 * 1024,
    },

    fileFilter(req, file, callback) {
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

      if (
        allowedExtensions.includes(extname(file.originalname).toLowerCase())
      ) {
        callback(null, true);
      } else {
        callback(new BadRequestException('Invalid image extension'), false);
      }
    },
  });
