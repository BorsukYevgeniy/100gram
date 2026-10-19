import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { ChatRole, ChatType, Reaction } from '../generated/prisma/enums';
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

describe('ChatMessageController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let memberAccessToken: string;
  let guestAccessToken: string;
  let unverifiedAccessToken: string;

  let groupChatId: number;
  let channelId: number;
  let privateChatId: number;
  let firstMessageId: number;
  let replyMessageId: number;

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
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [owner, member, guest, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'chat-message-owner@gmail.com',
          password: hashedPassword,
          nickname: 'chatmessageowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-message-member@gmail.com',
          password: hashedPassword,
          nickname: 'chatmessagemember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-message-guest@gmail.com',
          password: hashedPassword,
          nickname: 'chatmessageguest',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-message-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'chatmessageunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    const [ownerLogin, memberLogin, guestLogin, unverifiedLogin] =
      await Promise.all(
        [owner, member, guest, unverified].map(({ email }) =>
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
    guestAccessToken = guestLogin.headers['set-cookie'][0]
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

    const channel = await prisma.chat.create({
      data: { chatType: ChatType.CHANNEL },
    });

    channelId = channel.id;

    await prisma.chatToUser.createMany({
      data: [
        { chatId: channelId, userId: owner.id, role: ChatRole.OWNER },
        { chatId: channelId, userId: member.id },
      ],
    });

    const privateChat = await prisma.chat.create({
      data: { chatType: ChatType.PRIVATE },
    });

    privateChatId = privateChat.id;

    await prisma.chatToUser.createMany({
      data: [
        { chatId: privateChatId, userId: owner.id },
        { chatId: privateChatId, userId: member.id },
      ],
    });
  }, 10_000);

  describe('POST /chats/:chatId/messages - Should create a message', () => {
    it('POST /chats/:chatId/messages - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'First message' })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'First message' })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /chats/:chatId/messages - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/invalid/messages')
        .send({ text: 'First message' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'First message' })
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('POST /chats/:chatId/messages - 400 BAD REQUEST - Should return 400 because dto is invalid', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: '' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/:chatId/messages - 201 CREATED - Should create a message', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'First message' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          text: 'First message',
          createdAt: expect.any(String),
          replyId: null,
          userId: expect.any(Number),
          chatId: groupChatId,
          fileNames: [],
        }),
      );
      firstMessageId = body.id;
    });

    it('POST /chats/:chatId/messages - 404 NOT FOUND - Should return 404 when reply message does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'Reply', replyId: 999_999_999 })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('POST /chats/:chatId/messages - 201 CREATED - Should create a reply', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/messages`)
        .send({ text: 'A reply', replyId: firstMessageId })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(201);

      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          text: 'A reply',
          replyId: firstMessageId,
          userId: expect.any(Number),
          chatId: groupChatId,
          fileNames: [],
        }),
      );
      replyMessageId = body.id;
    });

    it('POST /chats/:chatId/messages - 403 FORBIDDEN - Should forbid a non-owner from writing to a channel', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${channelId}/messages`)
        .send({ text: 'Channel message' })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('POST /chats/:chatId/messages - 201 CREATED - Should allow the channel owner to create a message', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${channelId}/messages`)
        .send({ text: 'Channel message' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual(
        expect.objectContaining({
          text: 'Channel message',
          chatId: channelId,
          fileNames: [],
        }),
      );
    });
  });

  describe('GET /chats/:chatId/messages - Should paginate messages in chat', () => {
    it('GET /chats/:chatId/messages - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /chats/:chatId/messages - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .get('/chats/invalid/messages')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('GET /chats/:chatId/messages - 400 BAD REQUEST - Should return 400 because limit is invalid', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages?limit=invalid`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/:chatId/messages - 200 OK - Should return messages using cursor pagination', async () => {
      await request(app.getHttpServer())
        .post(`/messages/${replyMessageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(201);

      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages?limit=1`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        messages: [
          expect.objectContaining({
            id: replyMessageId,
            text: 'A reply',
            replyId: firstMessageId,
            fileNames: [],
            reactions: {
              like: { count: 1, isReactedByMe: false },
              dislike: { count: 0, isReactedByMe: false },
              heart: { count: 0, isReactedByMe: false },
              heartWithFire: { count: 0, isReactedByMe: false },
              fire: { count: 0, isReactedByMe: false },
            },
          }),
        ],
        limit: 1,
        nextCursor: replyMessageId,
        hasMore: true,
      });

      const memberPage = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages?limit=1`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(memberPage.body.messages[0].reactions.like).toEqual({
        count: 1,
        isReactedByMe: true,
      });

      const nextPage = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/messages?limit=1&cursor=${replyMessageId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(nextPage.body.messages[0]).toEqual(
        expect.objectContaining({
          id: firstMessageId,
          text: 'First message',
          fileNames: [],
          reactions: {
            like: { count: 0, isReactedByMe: false },
            dislike: { count: 0, isReactedByMe: false },
            heart: { count: 0, isReactedByMe: false },
            heartWithFire: { count: 0, isReactedByMe: false },
            fire: { count: 0, isReactedByMe: false },
          },
        }),
      );
    });
  });

  describe('DELETE /chats/:chatId/messages - Should delete all messages in chat', () => {
    it('DELETE /chats/:chatId/messages - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/messages`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/messages`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /chats/:chatId/messages - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .delete('/chats/invalid/messages')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/messages`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId/messages - 403 FORBIDDEN - Should return 403 because user is not the channel owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${channelId}/messages`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId/messages - 204 NO CONTENT - Should delete all messages from a private chat as a participant', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${privateChatId}/messages`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(204);
    });

    it('DELETE /chats/:chatId/messages - 204 NO CONTENT - Should delete all messages from a group chat as owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/messages`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(204);
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.close();
  });
});
