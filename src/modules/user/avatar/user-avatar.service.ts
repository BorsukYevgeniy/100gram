import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FileStorage } from '../../../common/storage/file.storage';
import { UserRepository } from '../user.repository';

import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Avatar } from '../../../common/types/avatar.types';
import { DEFAULT_AVATAR_NAME } from './avatar.constants';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileStorage: FileStorage,
    private readonly logger: PinoLogger,
    private readonly userRepo: UserRepository,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<Avatar> {
    const { avatar } = await this.userRepo.findById(userId);

    const newAvatarName = randomUUID().concat(extname(file.originalname));
    try {
      await this.fileStorage.writeUserAvatar(newAvatarName, file.buffer);
      await this.userRepo.updateAvatar(userId, newAvatarName);

      this.logger.info({ userId, newAvatarName }, 'Updated user avatar');

      if (avatar && avatar !== DEFAULT_AVATAR_NAME) {
        await this.fileStorage.unlinkUserAvatar(avatar);
      }

      return { avatarUrl: '/avatars/users/'.concat(newAvatarName) };
    } catch (e) {
      await this.fileStorage.unlinkUserAvatar(newAvatarName);
      throw e;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepo.findById(userId);

    if (user.avatar === DEFAULT_AVATAR_NAME) {
      this.logger.warn({ userId }, 'Cannot delete default user avatar');
      throw new BadRequestException('Cannot delete default user avatar');
    } else {
      await this.fileStorage.unlinkUserAvatar(user.avatar);
      await this.userRepo.updateAvatar(userId);

      this.logger.info({ userId }, 'Deleted user avatar');

      return { avatarUrl: `/avatars/users/${DEFAULT_AVATAR_NAME}` };
    }
  }
}
