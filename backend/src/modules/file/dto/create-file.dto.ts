import { FileType } from '../../../../generated/prisma/enums';

export class CreateFileDto {
  name: string;
  fileType: FileType;
  originalName: string;
}
