import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../../common/decorators/validation/trim.decorator';

export class CreateGroupChatDto {
  @IsString()
  @Trim()
  @Length(3, 20)
  title: string;

  @IsOptional()
  @IsString()
  @Length(2, 500)
  @Trim()
  description?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds: number[];
}
