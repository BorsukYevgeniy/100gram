import { FilesInterceptor } from '@nestjs/platform-express';

export const MessageFilesInterceptor = FilesInterceptor('files', 5, {
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MegaBytes
    fieldSize: 1024 * 1024 * 1024, // 1 GigaByte
  },
});
