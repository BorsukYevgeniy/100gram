import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { ChatRole, ChatType, FileType } from '../generated/prisma/enums';
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
  let memberId: number;
  let groupChatId: number;
  let messageId: number;
  let deletedForMeMessageId: number;

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
    await prisma.file.deleteMany({});
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
    memberId = member.id;

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
    await prisma.file.create({
      data: {
        name: 'message-controller-attachment',
        originalName: 'message-attachment.pdf',
        fileType: FileType.ATTACHMENT,
        messageId,
      },
    });

    const deletedForMeMessage = await prisma.message.create({
      data: {
        text: 'Message to remove for me',
        userId: owner.id,
        chatId: groupChatId,
      },
    });
    deletedForMeMessageId = deletedForMeMessage.id;

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
        .get('/messages/99999999')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('GET /messages/:id - 403 FORBIDDEN - Should return 403 because user is not participant', async () => {
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

      expect(body).toEqual({
        id: messageId,
        text: 'Original message',
        user: {
          id: ownerId,
          nickname: 'messagecontrollerowner',
          avatarName: null,
        },
        chatId: groupChatId,
        files: [
          {
            name: 'message-controller-attachment',
            originalName: 'message-attachment.pdf',
          },
        ],
        replyId: null,
        createdAt: expect.any(String),
        isPinned: false,
      });
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

      expect(body).toEqual({
        id: messageId,
        text: 'Updated message',
        user: {
          id: ownerId,
          nickname: 'messagecontrollerowner',
          avatarName: null,
        },
        chatId: groupChatId,
        files: [
          {
            name: 'message-controller-attachment',
            originalName: 'message-attachment.pdf',
          },
        ],
        replyId: null,
        createdAt: expect.any(String),
        isPinned: false,
      });
    });
  });

  describe('PATCH /messages/:id/pin - Should pin a message', () => {
    it('PATCH /messages/:id/pin - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/pin`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /messages/:id/pin - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/pin`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /messages/:id/pin - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/messages/invalid/pin')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:id/pin - 404 NOT FOUND - Should return 404 if message does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/messages/999999999/pin')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /messages/:id/pin - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/pin`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);

      expect(body).toEqual({
        statusCode: 403,
        message: 'User is not a participant of the chat',
        error: 'Forbidden',
      });
    });

    it('PATCH /messages/:id/pin - 200 OK - Should pin the message for a participant', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/pin`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: messageId,
          isPinned: true,
        }),
      );
    });
  });

  describe('PATCH /messages/:id/unpin - Should unpin a message', () => {
    it('PATCH /messages/:id/unpin - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/unpin`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /messages/:id/unpin - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/unpin`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /messages/:id/unpin - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/messages/invalid/unpin')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:id/unpin - 404 NOT FOUND - Should return 404 if message does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/messages/999999999/unpin')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /messages/:id/unpin - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/unpin`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);

      expect(body).toEqual({
        statusCode: 403,
        message: 'User is not a participant of the chat',
        error: 'Forbidden',
      });
    });

    it('PATCH /messages/:id/unpin - 200 OK - Should unpin the message for a participant', async () => {
      await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: true },
      });

      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${messageId}/unpin`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: messageId,
          isPinned: false,
        }),
      );
    });
  });

  describe('PATCH /messages/:id/deleted-for-me - Should add a message to deleted for me', () => {
    it('PATCH /messages/:id/deleted-for-me - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${deletedForMeMessageId}/deleted-for-me`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /messages/:id/deleted-for-me - 400 BAD REQUEST - Should return 400 because message id is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/messages/invalid/deleted-for-me')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('PATCH /messages/:id/deleted-for-me - 404 NOT FOUND - Should return 404 if message does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/messages/999999999/deleted-for-me')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });

    it('PATCH /messages/:id/deleted-for-me - 403 FORBIDDEN - Should return 403 because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${deletedForMeMessageId}/deleted-for-me`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /messages/:id/deleted-for-me - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${deletedForMeMessageId}/deleted-for-me`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);

      expect(body).toEqual({
        statusCode: 403,
        message: 'User is not a participant of the chat',
        error: 'Forbidden',
      });
    });

    it('PATCH /messages/:id/deleted-for-me - 200 OK - Should add the message only to the requesting user deleted list', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/messages/${deletedForMeMessageId}/deleted-for-me`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: deletedForMeMessageId,
          text: 'Message to remove for me',
        }),
      );

      const [memberDeletedMessages, ownerDeletedMessages] = await Promise.all([
        prisma.user.findUnique({
          where: { id: memberId },
          select: { deletedMessage: { select: { id: true } } },
        }),
        prisma.user.findUnique({
          where: { id: ownerId },
          select: { deletedMessage: { select: { id: true } } },
        }),
      ]);

      expect(memberDeletedMessages.deletedMessage).toContainEqual({
        id: deletedForMeMessageId,
      });
      expect(ownerDeletedMessages.deletedMessage).not.toContainEqual({
        id: deletedForMeMessageId,
      });
    });

    it('PATCH /messages/:id/deleted-for-me - 200 OK - Should not add the message twice', async () => {
      await request(app.getHttpServer())
        .patch(`/messages/${deletedForMeMessageId}/deleted-for-me`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      const memberDeletedMessages = await prisma.user.findUnique({
        where: { id: memberId },
        select: { deletedMessage: { select: { id: true } } },
      });

      expect(
        memberDeletedMessages.deletedMessage.filter(
          ({ id }) => id === deletedForMeMessageId,
        ),
      ).toHaveLength(1);
    });

    it('GET /chats/:chatId/messages - Should mark the message as deleted only for the requesting user', async () => {
      const [memberMessages, ownerMessages] = await Promise.all([
        request(app.getHttpServer())
          .get(`/chats/${groupChatId}/messages?limit=50`)
          .set('Cookie', [`access_token=${memberAccessToken}`])
          .expect(200),
        request(app.getHttpServer())
          .get(`/chats/${groupChatId}/messages?limit=50`)
          .set('Cookie', [`access_token=${ownerAccessToken}`])
          .expect(200),
      ]);

      expect(memberMessages.body.messages).toContainEqual(
        expect.objectContaining({
          id: deletedForMeMessageId,
          isDeletedForMe: true,
        }),
      );
      expect(ownerMessages.body.messages).toContainEqual(
        expect.objectContaining({
          id: deletedForMeMessageId,
          isDeletedForMe: false,
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

      expect(body).toEqual({
        id: messageId,
        text: 'Updated message',
        user: {
          id: ownerId,
          nickname: 'messagecontrollerowner',
          avatarName: null,
        },
        chatId: groupChatId,
        files: [
          {
            name: 'message-controller-attachment',
            originalName: 'message-attachment.pdf',
          },
        ],
        replyId: null,
        createdAt: expect.any(String),
        isPinned: false,
      });
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
    await prisma.file.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.message.deleteMany({});

    await app.close();
  });
});
