import { CreateFileInput } from '../types';

export interface CreateFilePayload {
  files: CreateFileInput[];
  key: string;
}
