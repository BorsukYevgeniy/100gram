import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { extname } from 'path';

export const AvatarInterceptor = FileInterceptor('avatar', {
  limits: {
    fileSize: 7 * 1024 * 1024, // 7 MegeBytes
  },

  fileFilter(req, file, callback) {
    console.log(extname(file.originalname));
    if (
      ['.png', '.jpg', '.jpeg', '.svg'].includes(extname(file.originalname))
    ) {
      callback(null, true);
    } else {
      callback(new BadRequestException('Invalid file extension'), false);
    }
  },
});
