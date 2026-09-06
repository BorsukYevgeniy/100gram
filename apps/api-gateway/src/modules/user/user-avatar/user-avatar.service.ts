import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

// import { Avatar } from '../../../common/types/avatar.types';
import { UserAvatarFileService } from './user-avatar-file.service';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileService: UserAvatarFileService,
    private readonly logger: PinoLogger,
    // private readonly userRepo: UserService,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
    // ): Promise<Avatar> {
  ) {
    try {
      const [newAvatarName] = await this.fileService.writeUserAvatar(file);
      // await this.userRepo.updateAvatar(userId, newAvatarName);

      this.logger.info({ userId, newAvatarName }, 'Updated user avatar');

      return { avatarUrl: newAvatarName };
    } catch (e) {
      // await this.fileService.unlinkUserAvatar(newAvatarName);
      throw e;
    }
  }

  // async deleteAvatar(userId: number) {
  //   const user = await this.userRepo.findFullUserById(userId);

  //   if (!user) {
  //     this.logger.warn({ userId }, 'User not found');
  //     throw new BadRequestException('User not found');
  //   }

  //   if (!user.avatar) {
  //     this.logger.warn({ userId }, 'Cannot delete default user avatar');
  //     throw new BadRequestException('Cannot delete default user avatar');
  //   }

  //   await this.fileService.unlinkUserAvatar(user.avatar);
  //   // await this.userRepo.updateAvatar(userId);

  //   this.logger.info({ userId }, 'Deleted user avatar');
  // }
}
