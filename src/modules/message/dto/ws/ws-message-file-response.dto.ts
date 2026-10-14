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

  @ApiProperty()
  userId: number;

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
