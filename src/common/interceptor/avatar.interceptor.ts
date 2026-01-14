import { FileInterceptor } from '@nestjs/platform-express';

export const AvatarInterceptor = FileInterceptor('avatar', {
  limits: {
    fileSize: 7 * 1024 * 1024, // 7 MegeBytes
  },
});
