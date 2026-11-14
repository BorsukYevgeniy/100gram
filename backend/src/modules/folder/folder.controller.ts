import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { VerifiedUserGuard } from '../auth/guards/verified-user.guard';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderService } from './folder.service';

@Controller('folders')
@UseGuards(VerifiedUserGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Get()
  async getMyFolder(@CurrentUser() { userId }: AccessTokenPayload) {
    return this.folderService.getFolders(userId);
  }

  @Get(':folderId')
  async getFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.getFolder(userId, folderId);
  }

  @Post()
  async createFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folderService.createFolder(userId, dto);
  }

  @Patch(':folderId')
  async updateFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.updateFolder(userId, folderId, dto);
  }

  @Delete(':folderId')
  async deleteFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.deleteFolder(userId, folderId);
  }

  @Post(':folderId/chats/:chatId')
  async addChatToFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.addChatToFolder(userId, folderId, chatId);
  }

  @Delete(':folderId/chats/:chatId')
  async removeChatToFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.removeChatFromFolder(userId, folderId, chatId);
  }

  @Patch(':folderId/chats/:chatId/pin')
  async pinChatInFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.pinChatInFolder(userId, folderId, chatId);
  }

  @Patch(':folderId/chats/:chatId/unpin')
  async unpinChatInFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.unpinChatInFolder(userId, folderId, chatId);
  }
}
