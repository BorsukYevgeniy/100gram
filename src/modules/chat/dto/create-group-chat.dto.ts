import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class CreateGroupChatDto {
  @IsString()
  @Length(3, 20)
  title: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  desctiption?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds: number[];
}
