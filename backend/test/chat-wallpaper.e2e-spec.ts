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

describe('ChatWallpaperController (e2e)', () => {
  let app: NestExpressApplication;
  let minio: MinioService;
  let prisma: PrismaService;
  let passwordSalt: number;
  let ownerAccessToken: string;
  let memberAccessToken: string;
  let unverifiedAccessToken: string;
  let groupChatId: number;
  let channelChatId: number;
  let defaultChannelChatId: number;
  let privateChatId: number;
  let wallpaperName: string;
  let channelWallpaperName: string;

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
          email: 'chat-wallpaper-owner@gmail.com',
          password: hashedPassword,
          nickname: 'chatwallpaperowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-wallpaper-member@gmail.com',
          password: hashedPassword,
          nickname: 'chatwallpapermember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-wallpaper-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'chatwallpaperunverified',
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

    const [groupChat, channelChat, defaultChannelChat, privateChat] =
      await Promise.all([
        prisma.chat.create({ data: { chatType: ChatType.GROUP } }),
        prisma.chat.create({ data: { chatType: ChatType.CHANNEL } }),
        prisma.chat.create({ data: { chatType: ChatType.CHANNEL } }),
        prisma.chat.create({ data: { chatType: ChatType.PRIVATE } }),
      ]);
    groupChatId = groupChat.id;
    channelChatId = channelChat.id;
    defaultChannelChatId = defaultChannelChat.id;
    privateChatId = privateChat.id;

    await prisma.chatToUser.createMany({
      data: [
        { chatId: groupChatId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: groupChatId, userId: member.id },
        { chatId: channelChatId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: channelChatId, userId: member.id },
        {
          chatId: defaultChannelChatId,
          userId: owner.id,
          role: ChatRole.OWNER,
        },
        { chatId: defaultChannelChatId, userId: member.id },
        { chatId: privateChatId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: privateChatId, userId: member.id, role: ChatRole.OWNER },
      ],
    });
  }, 10_000);

  describe('PATCH /chat/:chatId/wallpaper - Should update chat wallpaper', () => {
    it('PATCH /chat/:chatId/wallpaper - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chat/${groupChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chat/:chatId/wallpaper - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chat/${groupChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /chat/:chatId/wallpaper - 400 BAD REQUEST - Should return 400 because private chat type is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/chat/${privateChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chat/:chatId/wallpaper - 403 FORBIDDEN - Should return 403 because user is not owner', async () => {
      await request(app.getHttpServer())
        .patch(`/chat/${groupChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('PATCH /chat/:chatId/wallpaper - 404 NOT FOUND - Should return 404 if chat does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/chat/999999999/wallpaper')
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /chat/:chatId/wallpaper - 400 BAD REQUEST - Should return 400 because chatId is invalid text', async () => {
      await request(app.getHttpServer())
        .patch('/chat/invalid/wallpaper')
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chat/:chatId/wallpaper - 400 BAD REQUEST - Should return 400 because file extension is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/chat/${groupChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.txt')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chat/:chatId/wallpaper - 200 OK - Should update group wallpaper', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chat/${groupChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.jpg')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        wallpaperUrl: expect.stringMatching(
          /^wallpapers\/chats\/.+\.jpg$/,
        ),
      });

      wallpaperName = body.wallpaperUrl.split('/').pop();
      const chat = await prisma.chat.findUnique({
        where: { id: groupChatId },
        select: { wallpaperName: true },
      });
      expect(chat.wallpaperName).toBe(wallpaperName);
    });

    it('PATCH /chat/:chatId/wallpaper - 200 OK - Should update channel wallpaper', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chat/${channelChatId}/wallpaper`)
        .attach('wallpaper', Buffer.from('wallpaper'), 'wallpaper.png')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        wallpaperUrl: expect.stringMatching(
          /^wallpapers\/chats\/.+\.png$/,
        ),
      });
      channelWallpaperName = body.wallpaperUrl.split('/').pop();
    });
  });

  describe('DELETE /chat/:chatId/wallpaper - Should remove chat wallpaper', () => {
    it('DELETE /chat/:chatId/wallpaper - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chat/${groupChatId}/wallpaper`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /chat/:chatId/wallpaper - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chat/${groupChatId}/wallpaper`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /chat/:chatId/wallpaper - 400 BAD REQUEST - Should return 400 because private chat type is invalid', async () => {
      await request(app.getHttpServer())
        .delete(`/chat/${privateChatId}/wallpaper`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chat/:chatId/wallpaper - 403 FORBIDDEN - Should return 403 because user is not owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chat/${groupChatId}/wallpaper`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('DELETE /chat/:chatId/wallpaper - 404 NOT FOUND - Should return 404 if chat does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/chat/999999999/wallpaper')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('DELETE /chat/:chatId/wallpaper - 400 BAD REQUEST - Should return 400 because chatId is invalid text', async () => {
      await request(app.getHttpServer())
        .delete('/chat/invalid/wallpaper')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chat/:chatId/wallpaper - 409 CONFLICT - Should return 409 for default wallpaper', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chat/${defaultChannelChatId}/wallpaper`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);

      expect(body).toEqual({
        error: 'Conflict',
        message: 'Cannot delete default chat wallpaper',
        statusCode: 409,
      });
    });

    it('DELETE /chat/:chatId/wallpaper - 204 NO CONTENT - Should remove channel wallpaper', async () => {
      await request(app.getHttpServer())
        .delete(`/chat/${channelChatId}/wallpaper`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(204);
    });

    it('DELETE /chat/:chatId/wallpaper - 204 NO CONTENT - Should remove group wallpaper', async () => {
      await request(app.getHttpServer())
        .delete(`/chat/${groupChatId}/wallpaper`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(204);

      const chat = await prisma.chat.findUnique({
        where: { id: groupChatId },
        select: { wallpaperName: true },
      });
      expect(chat.wallpaperName).toBeNull();
    });

    it('DELETE /chat/:chatId/wallpaper - 409 CONFLICT - Should return 409 because wallpaper already removed', async () => {
      await request(app.getHttpServer())
        .delete(`/chat/${groupChatId}/wallpaper`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.file.deleteMany({});

    if (wallpaperName) {
      await minio.delete(`wallpapers/chats/${wallpaperName}`);
    }
    if (channelWallpaperName) {
      await minio.delete(`wallpapers/chats/${channelWallpaperName}`);
    }
    await app.close();
  });
});
