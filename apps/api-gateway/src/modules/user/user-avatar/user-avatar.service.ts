import { BadRequestException, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

// import { Avatar } from '../../../common/types/avatar.types';
import { FileTypeEnum } from '../../../../../../libs/contracts/src/files/enum';
import { FilesService } from '../../files/files.service';
import { UserService } from '../user.service';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly fileService: FilesService,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(UserAvatarService.name);
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
    // ): Promise<Avatar> {
  ) {
    let avatarName: string;
    try {
      const [{ name }] = await this.fileService.create([file], {
        fileType: FileTypeEnum.USER_AVATAR,
      });

      avatarName = name;

      await this.userService.updateAvatar(userId, name);

      this.logger.info({ userId, avatarName }, 'Updated user avatar');

      return { avatarName };
    } catch (e) {
      await this.fileService.delete([avatarName], FileTypeEnum.USER_AVATAR);
      throw e;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userService.findFullUserById(userId);

    if (!user.avatarName) {
      this.logger.warn({ userId }, 'Cannot delete default user avatar');
      throw new BadRequestException('Cannot delete default user avatar');
    }

    await this.fileService.delete([user.avatarName], FileTypeEnum.USER_AVATAR);
    await this.userService.updateAvatar(userId);

    this.logger.info({ userId }, 'Deleted user avatar');
  }
}
