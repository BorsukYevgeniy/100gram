import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserRepository } from '../user.repository';

import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Avatar } from '../../../common/types/avatar.types';
import { UserAvatarFileService } from './user-avatar-file.service';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileService: UserAvatarFileService,
    private readonly logger: PinoLogger,
    private readonly userRepo: UserRepository,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<Avatar> {
    const newAvatarName = randomUUID().concat(extname(file.originalname));
    try {
      await this.fileService.writeUserAvatar(newAvatarName, file.buffer);
      await this.userRepo.updateAvatar(userId, newAvatarName);

      this.logger.info({ userId, newAvatarName }, 'Updated user avatar');

      return { avatarUrl: '/avatars/users/'.concat(newAvatarName) };
    } catch (e) {
      await this.fileService.unlinkUserAvatar(newAvatarName);
      throw e;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepo.findFullUserById(userId);

    if (!user.avatar) {
      this.logger.warn({ userId }, 'Cannot delete default user avatar');
      throw new BadRequestException('Cannot delete default user avatar');
    }
    await this.fileService.unlinkUserAvatar(user.avatar);
    await this.userRepo.updateAvatar(userId);

    this.logger.info({ userId }, 'Deleted user avatar');
  }
}
