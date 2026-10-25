import { Injectable } from '@nestjs/common';
import { Message } from '../../../../generated/prisma/client';
import { MessageFiles } from '../types/message.types';

@Injectable()
export class MessageMapperService {
  toMessageFile(
    obj: Omit<Message, 'userId'> & {
      userId: number;
      user: { nickname: string; avatarName: string | null };
      files: { name: string }[];
    },
  ): MessageFiles {
    const { files, user, userId, ...msg } = obj;

    return {
      ...msg,
      user: {
        id: userId,
        nickname: user.nickname,
        avatarName: user.avatarName,
      },
      fileNames: files.map(({ name }) => name),
    };
  }
}
