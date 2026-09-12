import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UserRepository } from '../user.repository';

import { FileType } from '../../../../generated/prisma/enums';
import { Avatar } from '../../../common/types/avatar.types';
import { FileService } from '../../file/file.service';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileService: FileService,
    private readonly logger: PinoLogger,
    private readonly userRepo: UserRepository,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<Avatar> {
    let newAvatarName: string;
    try {
      const [{ name }] = await this.fileService.createFiles(
        [file],
        FileType.USER_AVATAR,
      );

      newAvatarName = name;
      await this.userRepo.updateAvatar(userId, newAvatarName);

      this.logger.info({ userId, newAvatarName }, 'Updated user avatar');

      return { avatarUrl: 'avatars/users/'.concat(newAvatarName) };
    } catch (e) {
      await this.fileService.deleteFiles([newAvatarName], FileType.USER_AVATAR);
      throw e;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepo.findFullUserById(userId);

    if (!user) {
      this.logger.warn({ userId }, 'User not found');
      throw new BadRequestException('User not found');
    }

    if (!user.avatarName) {
      this.logger.warn({ userId }, 'Cannot delete default user avatar');
      throw new BadRequestException('Cannot delete default user avatar');
    }

    await this.fileService.deleteFiles([user.avatarName], FileType.USER_AVATAR);
    await this.userRepo.deleteAvatar(userId);

    this.logger.info({ userId }, 'Deleted user avatar');
  }
}
