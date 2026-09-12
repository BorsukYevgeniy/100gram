import { CreateFileDto } from '../dto/create-file.dto';
import { CreateFileInput } from '../types';

export interface CreateFilePayload {
  files: CreateFileInput[];
  dto: CreateFileDto;
}
