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

      this.logger.info({ userId, newAvatarName }, 'Updated avatar');

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
      this.logger.warn({ userId }, 'Cannot delete default avatar ');
      throw new BadRequestException('Cannot delete default avatar');
    } else {
      await this.fileStorage.unlinkUserAvatar(user.avatar);
      const updatedUser = await this.userRepo.updateAvatar(userId);

      this.logger.info({ userId }, 'Deleted avatar');

      return updatedUser;
    }
  }
}
