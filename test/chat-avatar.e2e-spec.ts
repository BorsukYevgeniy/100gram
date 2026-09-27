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
import { MinioService } from '../src/infra/minio/minio.service';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ChatModule } from '../src/modules/chat/chat.module';
import {
  unauthorizedResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('ChatAvatarController (e2e)', () => {
  let app: NestExpressApplication;
  let minio: MinioService;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let memberAccessToken: string;
  let unverifiedAccessToken: string;
  let groupChatId: number;
  let privateChatId: number;
  let avatarName: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ChatModule,
        AuthModule,
        LoggerModule.forRootAsync({
          imports: [ConfigModule.forFeature(pinoConfig)],
          inject: [pinoConfig.KEY],
          useFactory: (c: ConfigType<typeof pinoConfig>) => c,
        }),
        ConfigModule.forRoot({ envFilePath: '.env.test' }),
        ConfigModule.forFeature(databaseConfig),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    minio = app.get<MinioService>(MinioService);
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

    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.file.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [owner, member, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'chat-avatar-owner@gmail.com',
          password: hashedPassword,
          nickname: 'chatavatarowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-avatar-member@gmail.com',
          password: hashedPassword,
          nickname: 'chatavatarmember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-avatar-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'chatavatarunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    const [ownerLogin, memberLogin, unverifiedLogin] = await Promise.all(
      [owner, member, unverified].map(({ email }) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password' })
          .expect(200),
      ),
    );

    ownerAccessToken = ownerLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    memberAccessToken = memberLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    unverifiedAccessToken = unverifiedLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    const groupChat = await prisma.chat.create({
      data: { chatType: ChatType.GROUP },
    });
    groupChatId = groupChat.id;
    await prisma.chatToUser.createMany({
      data: [
        { chatId: groupChatId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: groupChatId, userId: member.id },
      ],
    });

    const privateChat = await prisma.chat.create({
      data: { chatType: ChatType.PRIVATE },
    });
    privateChatId = privateChat.id;
    await prisma.chatToUser.createMany({
      data: [
        { chatId: privateChatId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: privateChatId, userId: member.id, role: ChatRole.OWNER },
      ],
    });
  }, 10_000);

  describe('PATCH /chats/:chatId/avatar - Should update chat avatar', () => {
    it('PATCH /chats/:chatId/avatar - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chats/:chatId/avatar - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /chats/:chatId/avatar - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/chats/invalid/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId/avatar - 400 BAD REQUEST - Should return 400 because file extension is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.txt')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId/avatar - 403 FORBIDDEN - Should return 403 because user is not the chat owner', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/avatar - 400 BAD REQUEST - Should only allow group chats', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${privateChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId/avatar - 404 NOT FOUND - Should return 404 if chat does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/chats/999999999/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /chats/:chatId/avatar - 200 OK - Should update the chat avatar', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/avatar`)
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        avatarUrl: expect.stringMatching(/^avatars\/chats\/.+\.jpg$/),
      });

      avatarName = body.avatarUrl.split('/').pop();
      const chat = await prisma.chat.findUnique({
        where: { id: groupChatId },
        select: { avatarName: true },
      });
      expect(chat.avatarName).toBe(avatarName);
    });
  });

  describe('DELETE /chats/:chatId/avatar - Should delete chat avatar', () => {
    it('DELETE /chats/:chatId/avatar - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/avatar`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /chats/:chatId/avatar - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/avatar`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /chats/:chatId/avatar - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .delete('/chats/invalid/avatar')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId/avatar - 403 FORBIDDEN - Should return 403 because user is not the chat owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/avatar`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId/avatar - 400 BAD REQUEST - Should only allow group chats', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${privateChatId}/avatar`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId/avatar - 204 NO CONTENT - Should delete the chat avatar', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/avatar`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(204);

      const chat = await prisma.chat.findUnique({
        where: { id: groupChatId },
        select: { avatarName: true },
      });
      expect(chat.avatarName).toBeNull();
    });

    it('DELETE /chats/:chatId/avatar - 400 BAD REQUEST - Should return 400 if chat has no avatar', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/avatar`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.file.deleteMany({});

    if (avatarName) {
      await minio.delete(`avatars/chats/${avatarName}`);
    }

    await app.close();
  });
});
