import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PinoLogger } from 'nestjs-pino';
import { ChatValidationService } from '../chat/validation/chat-validation.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderRepository } from './folder.repository';

@Injectable()
export class FolderService {
  constructor(
    private readonly repo: FolderRepository,
    private readonly logger: PinoLogger,
    private readonly chatValidator: ChatValidationService,
  ) {
    this.logger.setContext(FolderService.name);
  }

  private async validateFolderOwnership(userId: number, folderId: number) {
    const folder = await this.repo.getFolderOwnerId(folderId);

    if (!folder) {
      this.logger.warn({ folderId }, 'Folder not found');
      throw new NotFoundException(`Folder not found`);
    }

    if (folder.userId !== userId) {
      this.logger.warn(
        { userId, folderId },
        'User is not the owner of the folder',
      );
      throw new ForbiddenException(`You are not the owner of the folder `);
    }
  }

  private async validateChatInFolderExistence(
    folderId: number,
    chatId: number,
  ) {
    const chatExistence = await this.repo.checkChatInFolderExistence(
      folderId,
      chatId,
    );

    if (!chatExistence) {
      this.logger.warn({ folderId, chatId }, 'Chat is not in the folder');
      throw new ConflictException(`Chat doent exist in this folder`);
    }
  }

  async getFolder(userId: number, folderId: number) {
    await this.validateFolderOwnership(userId, folderId);
    return this.repo.getFolder(folderId);
  }

  async getFolders(userId: number) {
    return this.repo.getFolders(userId);
  }

  async createFolder(userId: number, dto: CreateFolderDto) {
    const folder = await this.repo.createFolder(userId, dto.name);

    this.logger.info({ userId, folderId: folder.id }, 'Created new folder');

    return folder;
  }

  async updateFolder(userId: number, folderId: number, dto: UpdateFolderDto) {
    await this.validateFolderOwnership(userId, folderId);

    try {
      const folder = await this.repo.updateFolder(folderId, dto.name);
      this.logger.info({ userId, folderId: folder.id }, 'Updated folder');

      return folder;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ folderId }, 'Folder not found');
        throw new NotFoundException(`Folder not found`);
      }
      throw e;
    }
  }

  async deleteFolder(userId: number, folderId: number) {
    await this.validateFolderOwnership(userId, folderId);

    const folder = await this.repo.deleteFolder(folderId);
    this.logger.info({ userId, folderId: folder.id }, 'Deleted folder');

    return folder;
  }

  async addChatToFolder(userId: number, folderId: number, chatId: number) {
    await this.validateFolderOwnership(userId, folderId);
    await this.chatValidator.validateChatParticipation(userId, chatId);

    const chatExistence = await this.repo.checkChatInFolderExistence(
      folderId,
      chatId,
    );

    if (chatExistence) {
      this.logger.warn({ folderId, chatId }, 'Chat already in the folder');
      throw new ConflictException(`Chat already in the folder`);
    }

    try {
      const chat = await this.repo.addChatToFolder(folderId, chatId);

      this.logger.info({ userId, folderId, chatId }, 'Added chat to folder');
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ folderId, chatId }, 'Chat not found');
        throw new NotFoundException(`Chat not found`);
      }
    }
  }

  async removeChatFromFolder(userId: number, folderId: number, chatId: number) {
    await this.validateFolderOwnership(userId, folderId);
    await this.chatValidator.validateChatParticipation(userId, chatId);
    await this.validateChatInFolderExistence(folderId, chatId);

    try {
      const chat = await this.repo.removeChatFromFolder(folderId, chatId);

      this.logger.info(
        { userId, folderId, chatId },
        'Removed chat from folder',
      );
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ folderId, chatId }, 'Chat not found');
        throw new NotFoundException(`Chat not found`);
      }
    }
  }

  async pinChatInFolder(userId: number, folderId: number, chatId: number) {
    await this.validateFolderOwnership(userId, folderId);
    await this.chatValidator.validateChatParticipation(userId, chatId);
    await this.validateChatInFolderExistence(folderId, chatId);

    try {
      const chat = await this.repo.pinChatInFolder(folderId, chatId);

      this.logger.info({ userId, folderId, chatId }, 'Pinned chat in folder');
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ folderId, chatId }, 'Chat not found');
        throw new NotFoundException(`Chat not found`);
      }
      throw e;
    }
  }

  async unpinChatInFolder(userId: number, folderId: number, chatId: number) {
    await this.validateFolderOwnership(userId, folderId);
    await this.chatValidator.validateChatParticipation(userId, chatId);
    await this.validateChatInFolderExistence(folderId, chatId);

    try {
      const chat = await this.repo.unpinChatInFolder(folderId, chatId);

      this.logger.info({ userId, folderId, chatId }, 'Unpinned chat in folder');
      return chat;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
        this.logger.warn({ folderId, chatId }, 'Chat not found');
        throw new NotFoundException(`Chat not found`);
      }
      throw e;
    }
  }
}
