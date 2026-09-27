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
import { ChatModule } from '../src/modules/chat/chat.module';
import {
  unauthorizedResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('MessageController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let memberAccessToken: string;
  let outsiderAccessToken: string;
  let unverifiedAccessToken: string;

  let ownerId: number;
  let groupChatId: number;
  let messageId: number;

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
    await prisma.message.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [owner, member, outsider, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'message-controller-owner@gmail.com',
          password: hashedPassword,
          nickname: 'messagecontrollerowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'message-controller-member@gmail.com',
          password: hashedPassword,
          nickname: 'messagecontrollermember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'message-controller-outsider@gmail.com',
          password: hashedPassword,
          nickname: 'messagecontrolleroutsider',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'message-controller-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'messagecontrollerunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    ownerId = owner.id;

    const [ownerLogin, memberLogin, outsiderLogin, unverifiedLogin] =
      await Promise.all(
        [owner, member, outsider, unverified].map(({ email }) =>
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
    outsiderAccessToken = outsiderLogin.headers['set-cookie'][0]
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

    const message = await prisma.message.create({
      data: {
        text: 'Original message',
        userId: owner.id,
        chatId: groupChatId,
      },
    });
    messageId = message.id;

    await prisma.chat.update({
      where: { id: groupChatId },
      data: { lastMessageId: messageId },
    });
  }, 10_000);

  describe('GET /messages/:id - Should return a message', () => {
    it('GET /messages/:id - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /messages/:id - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /messages/:id - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .get('/messages/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /messages/:id - 404 NOT FOUND - Should return 404 if message does not exist', async () => {
      await request(app.getHttpServer())
        .get('/messages/999999999')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('GET /messages/:id - 403 FORBIDDEN - Should return 403 because user is not the message owner', async () => {
      await request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('GET /messages/:id - 200 OK - Should return the message for its owner', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: messageId,
          text: 'Original message',
          userId: ownerId,
          chatId: groupChatId,
          files: [],
        }),
      );
    });
  });

  describe('PATCH /messages/:id - Should update a message', () => {
    it('PATCH /messages/:id - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ text: 'Updated message' })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /messages/:id - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/messages/invalid')
        .send({ text: 'Updated message' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:id - 403 FORBIDDEN - Should return 403 because user is not the message owner', async () => {
      await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ text: 'Updated message' })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('PATCH /messages/:id - 400 BAD REQUEST - Should return 400 because text is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ text: '' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:id - 200 OK - Should update the message for its owner', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}`)
        .send({ text: '  Updated message  ' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: messageId,
          text: 'Updated message',
          userId: ownerId,
          chatId: groupChatId,
          files: [],
        }),
      );
    });
  });

  describe('DELETE /messages/:id - Should delete a message', () => {
    it('DELETE /messages/:id - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /messages/:id - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .delete('/messages/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /messages/:id - 403 FORBIDDEN - Should return 403 because member cannot delete another user message', async () => {
      await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('DELETE /messages/:id - 200 OK - Should delete the message for its owner', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: messageId,
          text: 'Updated message',
          userId: ownerId,
          chatId: groupChatId,
          files: [],
        }),
      );
    });

    it('DELETE /messages/:id - 404 NOT FOUND - Should return 404 if message was already deleted', async () => {
      await request(app.getHttpServer())
        .delete(`/messages/${messageId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.message.deleteMany({});

    await app.close();
  });
});
