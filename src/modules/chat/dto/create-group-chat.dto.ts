import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { Visibility } from '../../../../generated/prisma/enums';
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

  @IsOptional()
  @IsString()
  @IsEnum(Visibility)
  @Trim()
  visibility: Visibility = Visibility.PRIVATE;

  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds: number[];
}
