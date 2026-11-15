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
import { FolderControllerDocs, FolderRoutesDocs } from './docs';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderService } from './folder.service';

@FolderControllerDocs()
@Controller('folders')
@UseGuards(VerifiedUserGuard)
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @FolderRoutesDocs.GetMyFolders()
  @Get()
  async getMyFolder(@CurrentUser() { userId }: AccessTokenPayload) {
    return this.folderService.getFolders(userId);
  }

  @FolderRoutesDocs.GetFolder()
  @Get(':folderId')
  async getFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.getFolder(userId, folderId);
  }

  @FolderRoutesDocs.CreateFolder()
  @Post()
  async createFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folderService.createFolder(userId, dto);
  }

  @FolderRoutesDocs.UpdateFolder()
  @Patch(':folderId')
  async updateFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.updateFolder(userId, folderId, dto);
  }

  @FolderRoutesDocs.DeleteFolder()
  @Delete(':folderId')
  async deleteFolder(
    @CurrentUser() { userId }: AccessTokenPayload,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.folderService.deleteFolder(userId, folderId);
  }

  @FolderRoutesDocs.AddChatToFolder()
  @Post(':folderId/chats/:chatId')
  async addChatToFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.addChatToFolder(userId, folderId, chatId);
  }

  @FolderRoutesDocs.RemoveChatFromFolder()
  @Delete(':folderId/chats/:chatId')
  async removeChatToFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.removeChatFromFolder(userId, folderId, chatId);
  }

  @FolderRoutesDocs.PinChatInFolder()
  @Patch(':folderId/chats/:chatId/pin')
  async pinChatInFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.pinChatInFolder(userId, folderId, chatId);
  }

  @FolderRoutesDocs.UnpinChatInFolder()
  @Patch(':folderId/chats/:chatId/unpin')
  async unpinChatInFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Param('chatId', ParseIntPipe) chatId: number,
    @CurrentUser() { userId }: AccessTokenPayload,
  ) {
    return this.folderService.unpinChatInFolder(userId, folderId, chatId);
  }
}
