import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { ChatType, Visibility } from '../generated/prisma/enums';
import authConfig from '../src/config/auth.config';
import databaseConfig from '../src/config/database.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ChatModule } from '../src/modules/chat/chat.module';
import {
  unauthorizedResponse,
  userNotFoundResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('ChatController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let guestAccessToken: string;
  let memberAccessToken: string;
  let unverifiedAccessToken: string;

  let ownerId: number;
  let memberId: number;
  let guestId: number;
  let privateChatId: number;
  let groupChatId: number;
  let publicGroupId: number;
  let groupInviteToken: string;

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
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [owner, member, guest, unverified] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'chat-owner@gmail.com',
          password: hashedPassword,
          nickname: 'chatowner',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-member@gmail.com',
          password: hashedPassword,
          nickname: 'chatmember',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-guest@gmail.com',
          password: hashedPassword,
          nickname: 'chatguest',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'chat-unverified@gmail.com',
          password: hashedPassword,
          nickname: 'chatunverified',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    ownerId = owner.id;
    memberId = member.id;
    guestId = guest.id;

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
  }, 10_000);

  describe('GET /chats/me - Should return my chats', () => {
    it('GET /chats/me - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/chats/me')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /chats/me - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/chats/me')
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /chats/me - 400 BAD REQUEST - Should return 400 because limit is invalid', async () => {
      await request(app.getHttpServer())
        .get('/chats/me?limit=invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/me - 200 OK - Should return an empty paginated list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/chats/me')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        limit: 10,
        hasMore: false,
        nextCursor: null,
        chats: [],
      });
    });
  });

  describe('POST /chats/private - Should create a private chat', () => {
    it('POST /chats/private - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/private')
        .send({ userId: memberId })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/private - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/private`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /chats/private - 400 BAD REQUEST - Should return 400 because dto is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/private')
        .send({ userId: -1 })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/private - 400 BAD REQUEST - Should not allow creating a chat with yourself', async () => {
      await request(app.getHttpServer())
        .post('/chats/private')
        .send({ userId: ownerId })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/private - 404 NOT FOUND - Should return 404 if the user does not exist', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/private')
        .send({ userId: 999_999_999 })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });

    it('POST /chats/private - 201 CREATED - Should create a private chat', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/private')
        .send({ userId: memberId })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        id: expect.any(Number),
        lastMessageId: null,
        chatType: ChatType.PRIVATE,
        visibility: Visibility.PRIVATE,
        avatarName: null,
        description: null,
        inviteToken: null,
        membersCount: 2,
        title: null,
      });
      privateChatId = body.id;
    });
  });

  describe('GET /chats/:chatId - Should return chat by id', () => {
    it('GET /chats/:chatId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${privateChatId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${privateChatId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /chats/:chatId - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .get('/chats/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${privateChatId}`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('GET /chats/:chatId - 200 OK - Should return the private chat', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${privateChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        id: privateChatId,
        lastMessageId: null,
        chatType: ChatType.PRIVATE,
        visibility: Visibility.PRIVATE,
      });
    });
  });

  describe('POST /chats/group - Should create a group chat', () => {
    it('POST /chats/group - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/group`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/group - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .post(`/chats/group`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('POST /chats/group - 400 BAD REQUEST - Should return 400 because dto is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/group')
        .send({ title: 'x', userIds: [memberId] })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/group - 409 CONFLICT - Should not allow adding the owner as a member', async () => {
      await request(app.getHttpServer())
        .post('/chats/group')
        .send({ title: 'Group chat', userIds: [ownerId] })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);
    });

    it('POST /chats/group - 404 NOT FOUND - Should return 404 if a member does not exist', async () => {
      await request(app.getHttpServer())
        .post('/chats/group')
        .send({ title: 'Group chat', userIds: [999_999_999] })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('POST /chats/group - 201 CREATED - Should create a group chat', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/group')
        .send({
          title: 'Group chat',
          description: 'Group description',
          userIds: [memberId],
        })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        id: expect.any(Number),
        chatType: ChatType.GROUP,
        visibility: Visibility.PRIVATE,
        title: 'Group chat',
        description: 'Group description',
        membersCount: 2,
        inviteToken: expect.any(String),

        lastMessageId: null,
        avatarName: null,
      });
      groupChatId = body.id;
      groupInviteToken = body.inviteToken;
    });

    it('POST /chats/group - 201 CREATED - Should create a public group', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/group')
        .send({
          title: 'Public group',
          description: 'Public description',
          userIds: [],
          visibility: Visibility.PUBLIC,
        })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual({
        id: expect.any(Number),
        chatType: ChatType.GROUP,
        visibility: Visibility.PUBLIC,
        title: 'Public group',
        description: 'Public description',
        membersCount: 1,
        inviteToken: null,
        lastMessageId: null,
        avatarName: null,
      });

      publicGroupId = body.id;
    });
  });

  describe('POST /chats/invite/:inviteToken - Should join a chat by invite token', () => {
    it('POST /chats/invite/:inviteToken - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/invite/${groupInviteToken}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/invite/:inviteToken - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .post(`/chats/invite/${groupInviteToken}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('POST /chats/invite/:inviteToken - 404 NOT FOUND - Should return 404 if invite token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/invite/invalid-token')
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(404);
    });

    it('POST /chats/invite/:inviteToken - 201 CREATED - Should add user to the invited chat', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/invite/${groupInviteToken}`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(201);

      expect(body[0]).toEqual(
        expect.objectContaining({ chatId: groupChatId, userId: guestId }),
      );
    });

    it('POST /chats/invite/:inviteToken - 409 CONFLICT - Should return 409 if user is already a participant', async () => {
      await request(app.getHttpServer())
        .post(`/chats/invite/${groupInviteToken}`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(409);
    });
  });

  describe('PATCH /chats/:chatId - Should update a group chat', () => {
    it('PATCH /chats/:chatId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    // it('PATCH /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not owner of chat', async () => {
    //   await request(app.getHttpServer())
    //     .patch(`/chats/${groupChatId}`)
    //     .set('Cookie', [`access_token=${guestAccessToken}`])
    //     .expect(403);
    // });

    it('PATCH /chats/:chatId - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/chats/invalid')
        .send({ title: 'Updated group' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId - 200 OK - Should update the group chat', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}`)
        .send({ title: 'Updated group', description: 'Updated description' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: groupChatId,
          title: 'Updated group',
          description: 'Updated description',
        }),
      );
    });
  });

  describe('PATCH /chats/:chatId/invite-token - Should update invite token', () => {
    it('PATCH /chats/:chatId/invite-token - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/invite-token`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chats/:chatId/invite-token - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/invite-token`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/invite-token - 403 FORBIDDEN - Should return 403 because user is not the owner', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/invite-token`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/invite-token - 200 OK - Should rotate the invite token', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/invite-token`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body.inviteToken).toEqual(expect.any(String));
      expect(body.inviteToken).not.toBe(groupInviteToken);
      groupInviteToken = body.inviteToken;
    });
  });

  describe('POST /chats/join/:chatId - Should join to public chat', () => {
    it('POST /chats/join/:chatId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/join/${groupChatId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/join/:chatId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .post(`/chats/join/${publicGroupId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('POST /chats/join/:chatId - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/join/invalid')
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(400);
    });

    it('POST /chats/join/:chatId - 201 CREATED - Should join a public group', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/join/${publicGroupId}`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(201);

      expect(body[0]).toEqual(
        expect.objectContaining({ chatId: publicGroupId, userId: guestId }),
      );
    });

    // it('POST /chats/join/:chatId - 409 CONFLICT - Should return 409 if user already joined', async () => {
    //   await request(app.getHttpServer())
    //     .post(`/chats/join/${publicGroupId}`)
    //     .set('Cookie', [`access_token=${guestAccessToken}`])
    //     .expect(409);
    // });
  });

  describe('PATCH /chats/:chatId/owner/:ownerId - Should update chat owner', () => {
    it('PATCH /chats/:chatId/owner/:ownerId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/owner/${memberId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chats/:chatId/owner/:ownerId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/owner/${memberId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/owner/:ownerId - 403 FORBIDDEN - Should return 403 because user is not the owner', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/owner/${memberId}`)
        .set('Cookie', [`access_token=${guestAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/owner/:ownerId - 200 OK - Should transfer chat ownership', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/owner/${memberId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          chatId: groupChatId,
          userId: memberId,
          role: 'OWNER',
        }),
      );
    });
  });

  describe('DELETE /chats/:chatId - Should delete a chat', () => {
    it('DELETE /chats/:chatId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId - 403 FORBIDDEN - Should return 403 because user is not the owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .delete('/chats/invalid')
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId - 200 OK - Should delete the chat as its owner', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(body).toEqual(
        expect.objectContaining({
          id: groupChatId,
          chatType: ChatType.GROUP,
          title: 'Updated group',
        }),
      );
    });

    it('DELETE /chats/:chatId - 404 NOT FOUND - Should return 404 code because chat not found', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });
  });

  describe('POST /chats/channel - Should create a channel', () => {
    it('POST /chats/channel - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/channel`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/channel - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      await request(app.getHttpServer())
        .post(`/chats/channel`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);
    });

    it('POST /chats/channel - 400 BAD REQUEST - Should return 400 because dto is invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/channel')
        .send({ title: 'x', visibility: Visibility.PUBLIC })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/channel - 201 CREATED - Should create a public channel', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/chats/channel')
        .send({ title: 'Public channel', visibility: Visibility.PUBLIC })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          chatType: ChatType.CHANNEL,
          visibility: Visibility.PUBLIC,
          title: 'Public channel',
        }),
      );
    });
  });

  afterAll(async () => {
    await prisma.chat.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });
});
