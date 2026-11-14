import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { ChatRole, ChatType } from '../generated/prisma/enums';
import authConfig from '../src/config/auth.config';
import databaseConfig from '../src/config/database.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { FolderModule } from '../src/modules/folder/folder.module';
import {
  unauthorizedResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('FolderController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let outsiderAccessToken: string;
  let unverifiedAccessToken: string;

  let ownerId: number;
  let outsiderId: number;
  let ownerChatId: number;
  let outsiderChatId: number;

  const createFolder = (userId: number, name = 'Test folder') =>
    prisma.folder.create({ data: { userId, name } });

  const createChat = async (userId: number, title: string) => {
    const chat = await prisma.chat.create({
      data: { title, chatType: ChatType.GROUP },
    });

    await prisma.chatToUser.create({
      data: { chatId: chat.id, userId, role: ChatRole.OWNER },
    });

    return chat;
  };

  const addChatToFolder = (folderId: number, chatId: number) =>
    prisma.folderToChat.create({ data: { folderId, chatId } });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        FolderModule,
        AuthModule,
        LoggerModule.forRootAsync({
          imports: [ConfigModule.forFeature(pinoConfig)],
          inject: [pinoConfig.KEY],
          useFactory: (config: ConfigType<typeof pinoConfig>) => config,
        }),
        ConfigModule.forRoot({ envFilePath: '.env.test' }),
        ConfigModule.forFeature(databaseConfig),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    passwordSalt = app.get<ConfigType<typeof authConfig>>(
      authConfig.KEY,
    ).passwordSalt;

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.useLogger(false);

    await prisma.folderToChat.deleteMany({});
    await prisma.folder.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [owner, outsider, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'folder-owner@gmail.com',
          password: hashedPassword,
          nickname: 'folderowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'folder-outsider@gmail.com',
          password: hashedPassword,
          nickname: 'folderoutsider',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'folder-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'folderunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    ownerId = owner.id;
    outsiderId = outsider.id;

    const [ownerLogin, outsiderLogin, unverifiedLogin] = await Promise.all(
      [owner, outsider, unverified].map(({ email }) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password' })
          .expect(200),
      ),
    );

    ownerAccessToken = ownerLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    outsiderAccessToken = outsiderLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    unverifiedAccessToken = unverifiedLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    const [ownerChat, outsiderChat] = await Promise.all([
      createChat(ownerId, 'Owner chat'),
      createChat(outsiderId, 'Outsider chat'),
    ]);

    ownerChatId = ownerChat.id;
    outsiderChatId = outsiderChat.id;
  }, 10_000);

  describe('GET /folders - Should return the current user folders', () => {
    it('GET /folders - 401 UNAUTHORIZED - Should require authentication', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/folders')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /folders - 403 FORBIDDEN - Should require a verified user', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/folders')
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /folders - 200 OK - Should return only folders owned by the current user', async () => {
      const ownerFolder = await createFolder(ownerId, 'Owner folder');
      const outsiderFolder = await createFolder(outsiderId, 'Outsider folder');

      const { body } = await request(app.getHttpServer())
        .get('/folders')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: ownerFolder.id, name: 'Owner folder' }),
        ]),
      );
      expect(body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: outsiderFolder.id }),
        ]),
      );
    });
  });

  describe('POST /folders - Should create a folder', () => {
    it('POST /folders - 401 UNAUTHORIZED - Should require authentication', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/folders')
        .send({ name: 'New folder' })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /folders - 403 FORBIDDEN - Should require a verified user', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/folders')
        .send({ name: 'New folder' })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it.each([
      ['missing name', {}],
      ['empty name', { name: '' }],
      ['name over 50 characters', { name: 'a'.repeat(51) }],
      ['non-string name', { name: 123 }],
    ])(
      'POST /folders - 400 BAD REQUEST - Should reject because %s',
      async (_, dto) => {
        await request(app.getHttpServer())
          .post('/folders')
          .send(dto)
          .set('Cookie', [`access_token=${ownerAccessToken}`])
          .expect(400);
      },
    );

    it('POST /folders - 201 CREATED - Should create a folder for the current user', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/folders')
        .send({ name: 'Work' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        id: expect.any(Number),
        name: 'Work',
        userId: ownerId,
        createdAt: expect.any(String),
      });
    });
  });

  describe('GET /folders/:folderId - Should return a folder', () => {
    it('GET /folders/:folderId - 400 BAD REQUEST - Should reject an invalid folder id', async () => {
      await request(app.getHttpServer())
        .get('/folders/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /folders/:folderId - 404 NOT FOUND - Should return 404 when the folder does not exist', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/folders/999999999')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);

      expect(body).toEqual({
        statusCode: 404,
        message: 'Folder not found',
        error: 'Not Found',
      });
    });

    it('GET /folders/:folderId - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      const { body } = await request(app.getHttpServer())
        .get(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /folders/:folderId - 403 FORBIDDEN - Should deny access to another user folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .get(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('GET /folders/:folderId - 200 OK - Should return a folder and its chats', async () => {
      const folder = await createFolder(ownerId, 'Favorites');
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .get(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        id: folder.id,
        name: 'Favorites',
        chats: [
          {
            id: ownerChatId,
            title: 'Owner chat',
            avatarName: null,
            lastMessage: null,
            isPinned: false,
          },
        ],
      });
    });
  });

  describe('PATCH /folders/:folderId - Should update a folder', () => {
    it('PATCH /folders/:folderId - 401 UNAUTHORIZED - Should require authentication', async () => {
      const folder = await createFolder(ownerId);

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}`)
        .send({ name: 'Updated' })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /folders/:folderId - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}`)
        .send({ name: 'Updated' })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /folders/:folderId - 400 BAD REQUEST - Should reject invalid ids and names', async () => {
      await request(app.getHttpServer())
        .patch('/folders/invalid')
        .send({ name: 'Updated' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);

      const folder = await createFolder(ownerId);
      await request(app.getHttpServer())
        .patch(`/folders/${folder.id}`)
        .send({ name: '' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /folders/:folderId - 403 FORBIDDEN - Should deny updating another user folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .patch(`/folders/${folder.id}`)
        .send({ name: 'Updated' })
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('PATCH /folders/:folderId - 200 OK - Should update the folder name', async () => {
      const folder = await createFolder(ownerId);

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}`)
        .send({ name: 'Updated' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        id: folder.id,
        name: 'Updated',
        userId: ownerId,
        createdAt: expect.any(String),
      });
    });
  });

  describe('DELETE /folders/:folderId - Should delete a folder', () => {
    it('DELETE /folders/:folderId - 401 UNAUTHORIZED - Should require authentication', async () => {
      const folder = await createFolder(ownerId);

      const { body } = await request(app.getHttpServer())
        .delete(`/folders/${folder.id}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /folders/:folderId - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      const { body } = await request(app.getHttpServer())
        .delete(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /folders/:folderId - 400 BAD REQUEST - Should reject an invalid folder id', async () => {
      await request(app.getHttpServer())
        .delete('/folders/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /folders/:folderId - 403 FORBIDDEN - Should deny deleting another user folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .delete(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('DELETE /folders/:folderId - 200 OK - Should delete the folder and its chat links', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .delete(`/folders/${folder.id}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        id: folder.id,
        name: folder.name,
        userId: ownerId,
        createdAt: expect.any(String),
      });
      await expect(
        prisma.folderToChat.findUnique({
          where: {
            folderId_chatId: { folderId: folder.id, chatId: ownerChatId },
          },
        }),
      ).resolves.toBeNull();
    });
  });

  describe('POST /folders/:folderId/chats/:chatId - Should add a chat to a folder', () => {
    it('POST /folders/:folderId/chats/:chatId - 401 UNAUTHORIZED - Should require authentication', async () => {
      const folder = await createFolder(ownerId);

      const { body } = await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${ownerChatId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /folders/:folderId/chats/:chatId - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      const { body } = await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /folders/:folderId/chats/:chatId - 400 BAD REQUEST - Should reject invalid ids', async () => {
      await request(app.getHttpServer())
        .post(`/folders/invalid/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);

      await request(app.getHttpServer())
        .post(`/folders/1/chats/invalid`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /folders/:folderId/chats/:chatId - 403 FORBIDDEN - Should deny modifying another user folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('POST /folders/:folderId/chats/:chatId - 403 FORBIDDEN - Should require chat participation', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${outsiderChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(403);
    });

    it('POST /folders/:folderId/chats/:chatId - 201 CREATED - Should add a chat and reject duplicates', async () => {
      const folder = await createFolder(ownerId);

      const { body } = await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        folderId: folder.id,
        chatId: ownerChatId,
        isPinned: false,
      });

      const { body: duplicateBody } = await request(app.getHttpServer())
        .post(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);

      expect(duplicateBody).toEqual({
        statusCode: 409,
        message: 'Chat already in the folder',
        error: 'Conflict',
      });
    });
  });

  describe('DELETE /folders/:folderId/chats/:chatId - Should remove a chat from a folder', () => {
    it('DELETE /folders/:folderId/chats/:chatId - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .delete(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /folders/:folderId/chats/:chatId - 409 CONFLICT - Should reject a chat not in the folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .delete(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);
    });

    it('DELETE /folders/:folderId/chats/:chatId - 200 OK - Should remove the chat', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .delete(`/folders/${folder.id}/chats/${ownerChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        folderId: folder.id,
        chatId: ownerChatId,
        isPinned: false,
      });
      await expect(
        prisma.folderToChat.findUnique({
          where: {
            folderId_chatId: { folderId: folder.id, chatId: ownerChatId },
          },
        }),
      ).resolves.toBeNull();
    });
  });

  describe('PATCH /folders/:folderId/chats/:chatId/pin - Should pin a chat', () => {
    it('PATCH /folders/:folderId/chats/:chatId/pin - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}/chats/${ownerChatId}/pin`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /folders/:folderId/chats/:chatId/pin - 409 CONFLICT - Should reject a chat not in the folder', async () => {
      const folder = await createFolder(ownerId);

      await request(app.getHttpServer())
        .patch(`/folders/${folder.id}/chats/${ownerChatId}/pin`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);
    });

    it('PATCH /folders/:folderId/chats/:chatId/pin - 200 OK - Should pin the chat', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}/chats/${ownerChatId}/pin`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        folderId: folder.id,
        chatId: ownerChatId,
        isPinned: true,
      });
    });
  });

  describe('PATCH /folders/:folderId/chats/:chatId/unpin - Should unpin a chat', () => {
    it('PATCH /folders/:folderId/chats/:chatId/unpin - 403 FORBIDDEN - Should require a verified user', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}/chats/${ownerChatId}/unpin`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /folders/:folderId/chats/:chatId/unpin - 200 OK - Should unpin the chat', async () => {
      const folder = await createFolder(ownerId);
      await addChatToFolder(folder.id, ownerChatId);
      await prisma.folderToChat.update({
        where: {
          folderId_chatId: { folderId: folder.id, chatId: ownerChatId },
        },
        data: { isPinned: true },
      });

      const { body } = await request(app.getHttpServer())
        .patch(`/folders/${folder.id}/chats/${ownerChatId}/unpin`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        folderId: folder.id,
        chatId: ownerChatId,
        isPinned: false,
      });
    });
  });

  afterAll(async () => {
    await prisma.folderToChat.deleteMany({});
    await prisma.folder.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.chat.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.close();
  });
});
