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

describe('MessageReactionController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let memberAccessToken: string;
  let outsiderAccessToken: string;
  let unverifiedAccessToken: string;

  let memberId: number;
  let messageId: number;
  let restrictedMessageId: number;
  let groupChatId: number;

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
    await prisma.reactionToMessage.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [member, outsider, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'message-reaction-member@gmail.com',
          password: hashedPassword,
          nickname: 'messagereactionmember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'message-reaction-outsider@gmail.com',
          password: hashedPassword,
          nickname: 'messagereactionoutsider',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'message-reaction-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'messagereactionunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    memberId = member.id;

    const [memberLogin, outsiderLogin, unverifiedLogin] = await Promise.all(
      [member, outsider, unverified].map(({ email }) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password' })
          .expect(200),
      ),
    );

    memberAccessToken = memberLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    outsiderAccessToken = outsiderLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    unverifiedAccessToken = unverifiedLogin.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    const chat = await prisma.chat.create({
      data: { chatType: ChatType.GROUP },
    });
    groupChatId = chat.id;

    await prisma.chatToUser.create({
      data: {
        chatId: groupChatId,
        userId: memberId,
        role: ChatRole.OWNER,
      },
    });

    const [message, restrictedMessage] = await Promise.all([
      prisma.message.create({
        data: {
          text: 'Message with reaction',
          userId: memberId,
          chatId: groupChatId,
        },
      }),
      prisma.message.create({
        data: {
          text: 'Restricted message',
          userId: memberId,
          chatId: groupChatId,
        },
      }),
    ]);
    messageId = message.id;
    restrictedMessageId = restrictedMessage.id;
  }, 10_000);

  describe('POST /messages/:messageId/reactions - Should add a reaction', () => {
    it('POST /messages/:messageId/reactions - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /messages/:messageId/reactions - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .post('/messages/invalid/reactions')
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('POST /messages/:messageId/reactions - 400 BAD REQUEST - Should return 400 because reaction is invalid', async () => {
      await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: 'INVALID' })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('POST /messages/:messageId/reactions - 404 NOT FOUND - Should return 404 if message does not exist', async () => {
      await request(app.getHttpServer())
        .post('/messages/999999999/reactions')
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });

    it('POST /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because user is not a participant of chat', async () => {
      await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('POST /messages/:messageId/reactions - 201 CREATED - Should add a reaction', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        messageId,
        userId: memberId,
        reaction: Reaction.LIKE,
        createdAt: expect.any(String),
      });
    });
  });

  describe('PATCH /messages/:messageId/reactions - Should update a reaction', () => {
    it('PATCH /messages/:messageId/reactions - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.HEART })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.HEART })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /messages/:messageId/reactions - 400 BAD REQUEST - Should return 400 because reaction is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: 'INVALID' })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:messageId/reactions - 200 OK - Should update the reaction', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.HEART })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        messageId,
        userId: memberId,
        reaction: Reaction.HEART,
        createdAt: expect.any(String),
      });
    });

    it('PATCH /messages/:messageId/reactions - 404 NOT FOUND - Should return 404 if reaction does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/messages/999999999/reactions')
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });
  });

  describe('DELETE /messages/:messageId/reactions - Should delete a reaction', () => {
    it('DELETE /messages/:messageId/reactions - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/messages/${messageId}/reactions`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/messages/${messageId}/reactions`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /messages/:messageId/reactions - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .delete('/messages/invalid/reactions')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('DELETE /messages/:messageId/reactions - 200 OK - Should delete the reaction', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/messages/${messageId}/reactions`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        messageId,
        userId: memberId,
        reaction: Reaction.HEART,
        createdAt: expect.any(String),
      });
    });

    it('DELETE /messages/:messageId/reactions - 404 NOT FOUND - Should return 404 if reaction does not exist', async () => {
      await request(app.getHttpServer())
        .delete(`/messages/${messageId}/reactions`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });
  });

  describe('PATCH /chats/:chatId/allowed-reactions - Should restrict reactions in a chat', () => {
    beforeAll(async () => {
      await prisma.chat.update({
        where: { id: groupChatId },
        data: { allowedReactions: [Reaction.LIKE] },
      });
    });

    it('POST /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because the reaction is not allowed in the chat', async () => {
      await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.HEART })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('PATCH /messages/:messageId/reactions - 403 FORBIDDEN - Should return 403 because the reaction is not allowed in the chat', async () => {
      await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.HEART })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('POST /messages/:messageId/reactions - 201 CREATED - Should add a reaction when it is allowed in the chat', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        messageId,
        userId: memberId,
        reaction: Reaction.LIKE,
        createdAt: expect.any(String),
      });
    });

    it('PATCH /messages/:messageId/reactions - 200 OK - Should update a reaction when it is allowed in the chat', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/reactions`)
        .send({ reaction: Reaction.LIKE })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        messageId,
        userId: memberId,
        reaction: Reaction.LIKE,
        createdAt: expect.any(String),
      });
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.chatToUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.reactionToMessage.deleteMany({});
    await app.close();
  });
});
