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
import { CurrentUser } from '../../../common/decorators/routes/user.decorator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AccessTokenPayload } from '../../../common/types';
import { VerifiedUserGuard } from '../../auth/guards/verified-user.guard';
import { PaginatedUserNoCredOtpVCode } from '../../user/types/user.types';

import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateRoleDto } from '../dto/role/update-role.dto';
import { ChatUserService } from './chat-user.service';

@ApiTags('Chat Message')
@ApiParam({
  name: 'chatId',
  type: Number,
  required: true,
  description: 'ID of chat',
})
@ApiCookieAuth('access_token')
@ApiCookieAuth('refresh_token')
@ApiUnauthorizedResponse({
  description: 'You must be authorized to access this resource',
})
@ApiForbiddenResponse({
  description: 'You must be a verified user to access this resource',
})
@Controller('chats/:chatId/users')
@UseGuards(VerifiedUserGuard)
export class ChatUserController {
  constructor(private readonly chatUserService: ChatUserService) {}

  @ApiOperation({
    summary: 'Fetch all users in chat',
    description: 'Return all users in someone chat with pagination',
  })
  @ApiOkResponse({ description: 'Fetched users in chat' })
  @ApiNotFoundResponse({ description: 'Chat not found' })
  @Get()
  async getUsersInChat(
    @CurrentUser() user: AccessTokenPayload,
    @Param('chatId') chatId: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedUserNoCredOtpVCode> {
    return this.chatUserService.getUsersInChat(user, chatId, paginationDto);
  }

  @ApiOperation({
    summary: 'Add users to chat',
    description: 'Add a new user in someone chat',
  })
  @ApiOkResponse({ description: 'User added' })
  @ApiNotFoundResponse({ description: 'Chat or user not found' })
  @ApiBadRequestResponse({
    description: 'User already is a participant of the chat',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID of user which are you want to add in chat',
  })
  @Post(':userId')
  async addUserToChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.addUserToChat(chatId, userId);
  }

  @ApiOperation({
    summary: 'Delete users to chat',
    description: 'Delete a user from someone chat',
  })
  @ApiOkResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'Chat or user not found' })
  @ApiBadRequestResponse({
    description: 'User already isnt a participant of the chat',
  })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID of user which are you want to delete from chat',
  })
  @Delete(':userId')
  async deleteUserFromChat(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
  ) {
    return this.chatUserService.deleteUserFromChat(chatId, userId);
  }

  @ApiOperation({
    summary: 'Update role of user in chat',
    description: 'Update role of user in someone chat',
  })
  @ApiOkResponse({ description: 'Role updated' })
  @ApiNotFoundResponse({ description: 'Chat or user not found' })
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'ID of user which are you want to update role in chat',
  })
  @ApiBody({ type: UpdateRoleDto, required: true })
  @Patch(':userId/role')
  async updateUserRole(
    @Param('chatId') chatId: number,
    @Param('userId') userId: number,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: AccessTokenPayload,
  ) {
    return this.chatUserService.updateUserChatRole(
      currentUser,
      chatId,
      userId,
      dto,
    );
  }
}
