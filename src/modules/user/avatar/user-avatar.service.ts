import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileStorage } from '../../../common/storage/file.storage';
import { UserRepository } from '../user.repository';

import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly logger: PinoLogger,
    private readonly userRepo: UserRepository,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    const { avatar } = await this.userRepo.findById(userId);

    const newAvatarName = randomUUID().concat(extname(file.originalname));
    try {
      await this.fileStorage.writeUserAvatar(newAvatarName, file.buffer);
      const newUser = await this.userRepo.updateAvatar(userId, newAvatarName);

      if (avatar && avatar !== 'DEFAULT_USER_AVATAR.png') {
        await this.fileStorage.unlinkUserAvatar(avatar);
      }

      return newUser;
    } catch (e) {
      await this.fileStorage.unlinkUserAvatar(newAvatarName);
      throw e;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepo.findById(userId);

    if (user.avatar === 'DEFAULT_USER_AVATAR.png') {
      throw new BadRequestException('Cannot delete default avatar');
    } else {
      await this.fileStorage.unlinkUserAvatar(user.avatar);
      return this.userRepo.updateAvatar(userId);
    }
  }
}
