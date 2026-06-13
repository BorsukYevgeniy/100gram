import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../common/types';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { ChatService } from './chat.service';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { CreatePrivateChatDto } from './dto/create-private-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

@ApiTags('Chat')
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({
  description: 'You must be authorized to access this resource',
})
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@Controller('chats')
@UseGuards(VerifiedUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({
    summary: 'Get my chats',
    description: 'Return where chats you exist',
  })
  @ApiOkResponse({ description: 'Chats fetched successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiQuery({ type: PaginationDto })
  @Get('me')
  async getMyChats(
    @CurrentUser() user: AccessTokenPayload,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.chatService.getMyChats(user.id, paginationDto);
  }

  @ApiOperation({
    summary: 'Craete private chat',
    description: 'Create chat with 1 user',
  })
  @ApiOkResponse({ description: 'Chat created successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'You cant create chat with yourself' })
  @ApiBody({ type: CreatePrivateChatDto })
  @Post('private')
  async createPrivateChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreatePrivateChatDto,
  ) {
    return this.chatService.createPrivateChat(user.id, dto);
  }

  @ApiOperation({
    summary: 'Create group chat',
    description: 'Create chat with many users',
  })
  @ApiOkResponse({ description: 'Chat created successfully' })
  @ApiNotFoundResponse({ description: 'Users not found' })
  @ApiBody({ type: CreateGroupChatDto })
  @Post('group')
  async createGroupChat(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatService.createGroupChat(user.id, dto);
  }

  @ApiOperation({
    summary: 'Add user by invite token',
    description: 'Add user to chat by invite token',
  })
  @ApiOkResponse({ description: 'User added successfully' })
  @ApiNotFoundResponse({ description: 'Token not found' })
  @ApiParam({
    name: 'inviteToken',
    type: String,
    required: true,
    description: 'Token for inviting user',
  })
  @Post('invite/:inviteToken')
  async addChatByInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('inviteToken') inviteToken: string,
  ) {
    return this.chatService.addUserByInviteToken(user, inviteToken);
  }

  @ApiOperation({
    summary: 'Update invite token',
    description: 'Update token for inviting users',
  })
  @ApiOkResponse({ description: 'Token updated successfully' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiForbiddenResponse({
    description: 'You must be an owner of chat to update invite token',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat',
  })
  @Patch(':chatId/invite-token')
  async updateInviteToken(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
  ) {
    return this.chatService.updateInviteToken(user, chatId);
  }

  @ApiOperation({
    summary: 'Get chat by ID',
    description: 'Getting chat by ID',
  })
  @ApiOkResponse({ description: 'Chat fetched successfully' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiForbiddenResponse({
    description: 'You must be a participant of chat',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat',
  })
  @Get(':chatId')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') id: number,
  ) {
    return this.chatService.findById(user, id);
  }

  @ApiOperation({
    summary: 'Updating owner in chat by ID',
    description: 'Setting new owner in chat by ID',
  })
  @ApiOkResponse({ description: 'Owner updated successfully' })
  @ApiBadRequestResponse({ description: 'Chat must be a group' })
  @ApiNotFoundResponse({ description: 'Chat or new owner not found' })
  @ApiForbiddenResponse({
    description: 'You must be an owner of chat to change owner',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat',
  })
  @ApiParam({
    name: 'ownerId',
    type: Number,
    required: true,
    description: 'ID of new owner',
  })
  @Patch(':chatId/owner/:ownerId')
  async updateOwner(
    @Param('chatId') chatId: number,
    @Param('ownerId') ownerId: number,
  ) {
    return this.chatService.updateOwner(chatId, ownerId);
  }

  @ApiOperation({
    summary: 'Updating chat by ID',
    description: 'Updated chat data by ID',
  })
  @ApiOkResponse({ description: 'Chat updated successfully' })
  @ApiBadRequestResponse({ description: 'Chat must be a group' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiForbiddenResponse({
    description: 'You must be an owner of chat',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat',
  })
  @ApiBody({ type: UpdateGroupChatDto })
  @Patch(':chatId')
  async updateGroupChat(
    @Param('chatId') chatId: number,
    @Body() updateChatDto: UpdateGroupChatDto,
  ) {
    return this.chatService.updateGroupChat(chatId, updateChatDto);
  }

  @ApiOperation({
    summary: 'Deleting chat by ID',
    description: 'Delete chat by ID',
  })
  @ApiOkResponse({ description: 'Chat deleted successfully' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @ApiForbiddenResponse({
    description: 'You must be an owner of chat',
  })
  @ApiParam({
    name: 'chatId',
    type: Number,
    required: true,
    description: 'ID of chat which are you want to delete',
  })
  @Delete(':id')
  async delete(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: number,
  ) {
    return this.chatService.delete(user, id);
  }
}
