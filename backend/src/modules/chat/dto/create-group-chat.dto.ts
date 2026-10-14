import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    type: String,
    description: 'Title of the group chat',
    required: true,
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @Trim()
  @Length(3, 20)
  title: string;

  @ApiProperty({
    type: String,
    description: 'Description of the group chat',
    required: false,
    minLength: 2,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  @Trim()
  description?: string;

  @ApiProperty({
    type: String,
    description: 'Visibility of the group chat',
    required: false,
    enum: Visibility,
  })
  @IsOptional()
  @IsString()
  @IsEnum(Visibility)
  @Trim()
  visibility: Visibility = Visibility.PRIVATE;

  @ApiProperty({
    type: [Number],
    description: 'IDs of users with which you want to create a group chat',
    required: true,
    isArray: true,
    allOf: [{ minimum: 0 }],
  })
  @IsArray()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  userIds: number[];
}
