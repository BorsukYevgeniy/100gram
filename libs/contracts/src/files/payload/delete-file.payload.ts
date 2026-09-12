import { FileTypeEnum } from '../enum';

export interface DeleteFilePayload {
  names: string[];
  fileType: FileTypeEnum;
}
