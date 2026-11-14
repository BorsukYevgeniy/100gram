import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class FolderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getFolderOwnerId(folderId: number) {
    return this.prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true },
    });
  }

  async checkChatInFolderExistence(folderId: number, chatId: number) {
    const chatCount = await this.prisma.folderToChat.count({
      where: { folderId, chatId },
    });

    return chatCount > 0;
  }

  async getFolder(folderId: number) {
    const { id, name, ...chatsToFolder } = await this.prisma.folder.findUnique({
      where: { id: folderId },
      select: {
        id: true,
        name: true,
        chatsToFolder: {
          select: {
            chat: {
              select: {
                id: true,
                title: true,
                avatarName: true,
                lastMessage: { select: { text: true, createdAt: true } },
              },
            },
            isPinned: true,
          },
        },
      },
    });

    return {
      id,
      name,
      chats: chatsToFolder.chatsToFolder.map(({ chat, isPinned }) => ({
        id: chat.id,
        title: chat.title,
        avatarName: chat.avatarName,
        lastMessage: chat.lastMessage,
        isPinned,
        // IsPinned means that the chat is pinned in this folder
      })),
    };
  }

  async getFolders(userId: number) {
    return this.prisma.folder.findMany({
      where: { user: { id: userId } },
    });
  }

  async createFolder(userId: number, name: string) {
    return this.prisma.folder.create({
      data: { name, user: { connect: { id: userId } } },
    });
  }

  async updateFolder(folderId: number, name: string) {
    return this.prisma.folder.update({
      where: { id: folderId },
      data: { name },
    });
  }

  async deleteFolder(folderId: number) {
    return this.prisma.folder.delete({
      where: { id: folderId },
    });
  }

  async addChatToFolder(folderId: number, chatId: number) {
    return this.prisma.folderToChat.create({
      data: {
        chat: { connect: { id: chatId } },
        folder: { connect: { id: folderId } },
      },
    });
  }

  async removeChatFromFolder(folderId: number, chatId: number) {
    return this.prisma.folderToChat.delete({
      where: { folderId_chatId: { folderId, chatId } },
    });
  }

  async pinChatInFolder(folderId: number, chatId: number) {
    return this.prisma.folderToChat.update({
      where: { folderId_chatId: { folderId, chatId } },
      data: { isPinned: true },
    });
  }

  async unpinChatInFolder(folderId: number, chatId: number) {
    return this.prisma.folderToChat.update({
      where: { folderId_chatId: { folderId, chatId } },
      data: { isPinned: false },
    });
  }
}
