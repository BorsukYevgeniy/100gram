import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Message } from '../../../generated/prisma/client';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { MessageFilesInterceptor } from '../../common/interceptor/message-files.interceptor';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@ApiTags('Message')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({
  description: 'You must be authorized to access this resource',
})
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@ApiForbiddenResponse({
  description: 'You are not the owner of this message',
})
@Controller('messages')
@UseGuards(VerifiedUserGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOperation({
    summary: 'Get message by ID',
    description: 'Returns a message by its ID',
  })
  @ApiOkResponse({
    description: 'Message fetched successfully',
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the message',
    required: true,
  })
  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.findById(user, messageId);
  }

  @ApiOperation({
    summary: 'Update message',
    description: 'Updates message content and attachments',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Message content',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Message updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid message data or attachments',
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the message',
    required: true,
  })
  @Patch(':id')
  @UseInterceptors(MessageFilesInterceptor)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Message> {
    return this.messageService.update(user, messageId, updateMessageDto, files);
  }

  @ApiOperation({
    summary: 'Delete message',
    description: 'Deletes a message by ID',
  })
  @ApiOkResponse({
    description: 'Message deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Message not found' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the message',
    required: true,
  })
  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') messageId: number,
  ): Promise<Message> {
    return this.messageService.delete(user, messageId);
  }
}
