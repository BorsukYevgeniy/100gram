import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../../../../../generated/prisma/enums';

class WsMessageFileDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FileType, enumName: 'FileType' })
  fileType: FileType;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: Number, nullable: true })
  messageId: number | null;
}

class WsMessageUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nickname: string;
}

export class WsMessageFileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  chatId: number;

  @ApiProperty()
  text: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: Number, nullable: true })
  replyId: number | null;

  @ApiProperty({ type: WsMessageUserDto })
  user: WsMessageUserDto;

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty({ type: [WsMessageFileDto] })
  files: {
    name: string;
    fileType: FileType;
    createdAt: Date;
    messageId: number | null;
  }[];
}
