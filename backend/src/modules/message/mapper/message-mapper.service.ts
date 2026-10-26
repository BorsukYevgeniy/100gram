import { Injectable } from '@nestjs/common';

@Injectable()
export class MessageMapperService {
  // toMessageFile(
  //   obj: Omit<Message, 'userId'> & {
  //     user: { id: number; nickname: string; avatarName: string | null };
  //     files: { name: string; originalName: string }[];
  //   },
  // ): MessageFiles {
  //   const { files, user, ...msg } = obj;
  //   return {
  //     ...msg,
  //     user,
  //     files,
  //   };
  // }
}
