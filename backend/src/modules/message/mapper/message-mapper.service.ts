import { Injectable } from '@nestjs/common';
import { MessageFiles } from '../types/message.types';

@Injectable()
export class MessageMapperService {
  toMessageFile(
    obj: {
      files: {
        name: string;
      }[];
    } & {
      id: number;
      text: string;
      createdAt: Date;
      replyId: number;
      userId: number;
      chatId: number;
      isPinned: boolean;
    },
  ): MessageFiles {
    const { files, ...msg } = obj;

    return {
      ...msg,
      fileNames: files.map(({ name }) => name),
    };
  }
}
