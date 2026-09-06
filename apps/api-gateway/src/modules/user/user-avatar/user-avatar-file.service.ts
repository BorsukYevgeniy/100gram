import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FilePattern } from '@app/contracts/files/pattern/file.pattern';
import { CreateFilePayload } from '@app/contracts/files/payload/create-file.payload';
import { FILES_CLIENT } from '../../../common/client/files/files-client.constants';

@Injectable()
export class UserAvatarFileService {
  constructor(@Inject(FILES_CLIENT) private readonly fileClient: ClientProxy) {}

  private async send<TOut, TIn>(
    pattern: FilePattern,
    input: TIn,
  ): Promise<TOut> {
    return firstValueFrom(this.fileClient.send<TOut, TIn>(pattern, input));
  }

  async writeUserAvatar(file: Express.Multer.File) {
    return await this.send<string[], CreateFilePayload>(
      FilePattern.CREATE_FILE,
      {
        files: [
          {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer.toString('base64'),
          },
        ],
        key: 'avatars/users/',
      },
    );
  }

  // async unlinkUserAvatar(fileName: string) {
  //   return this.fileClient.unlink(fileName, this.USER_AVATAR_DIR_PATH);
  // }
}

