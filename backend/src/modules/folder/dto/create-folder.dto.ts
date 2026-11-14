import { IsString, Length } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @Length(1, 50)
  name: string;
}
