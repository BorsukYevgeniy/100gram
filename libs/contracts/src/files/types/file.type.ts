import { FileType } from '../enum';

export type File = {
  // id: string;
  name: string;
  fileType: FileType;
  createdAt: Date;
};
