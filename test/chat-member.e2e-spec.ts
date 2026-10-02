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

describe('ChatMemberController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

  let ownerAccessToken: string;
  let memberAccessToken: string;
  let outsiderAccessToken: string;
  let unverifiedAccessToken: string;

  let ownerId: number;
  let memberId: number;
  let invitedUserId: number;
  let outsiderId: number;
  let groupChatId: number;
  let privateChatId: number;

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
    const [owner, member, invitedUser, outsider, unverified] =
      await Promise.all([
        prisma.user.create({
          data: {
            email: 'chat-member-owner@gmail.com',
            password: hashedPassword,
            nickname: 'chatmemberowner',
            isVerified: true,
          },
          select: { id: true, email: true },
        }),
        prisma.user.create({
          data: {
            email: 'chat-member-user@gmail.com',
            password: hashedPassword,
            nickname: 'chatmemberuser',
            isVerified: true,
          },
          select: { id: true, email: true },
        }),
        prisma.user.create({
          data: {
            email: 'chat-member-invited@gmail.com',
            password: hashedPassword,
            nickname: 'chatmemberinvited',
            isVerified: true,
          },
          select: { id: true, email: true },
        }),
        prisma.user.create({
          data: {
            email: 'chat-member-outsider@gmail.com',
            password: hashedPassword,
            nickname: 'chatmemberoutsider',
            isVerified: true,
          },
          select: { id: true, email: true },
        }),
        prisma.user.create({
          data: {
            email: 'chat-member-unverified@gmail.com',
            password: hashedPassword,
            nickname: 'chatmemberunverified',
            isVerified: false,
          },
          select: { id: true, email: true },
        }),
      ]);

    ownerId = owner.id;
    memberId = member.id;
    invitedUserId = invitedUser.id;
    outsiderId = outsider.id;

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
        { chatId: groupChatId, userId: ownerId, role: ChatRole.OWNER },
        { chatId: groupChatId, userId: memberId },
      ],
    });

    const privateChat = await prisma.chat.create({
      data: { chatType: ChatType.PRIVATE },
    });
    privateChatId = privateChat.id;

    await prisma.chatToUser.createMany({
      data: [
        { chatId: privateChatId, userId: ownerId, role: ChatRole.OWNER },
        { chatId: privateChatId, userId: memberId, role: ChatRole.OWNER },
      ],
    });
  }, 10_000);

  describe('GET /chats/:chatId/users - Should return users in chat', () => {
    it('GET /chats/:chatId/users - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /chats/:chatId/users - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('GET /chats/:chatId/users - 400 BAD REQUEST - Should return 400 because chatId is invalid', async () => {
      await request(app.getHttpServer())
        .get('/chats/invalid/users')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/:chatId/users - 403 FORBIDDEN - Should return 403 because user is not a participant', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users`)
        .set('Cookie', [`access_token=${outsiderAccessToken}`])
        .expect(403);
    });

    it('GET /chats/:chatId/users - 400 BAD REQUEST - Should return 400 because limit is invalid', async () => {
      await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users?limit=invalid`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('GET /chats/:chatId/users - 200 OK - Should return users using cursor pagination without credentials', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users?limit=1`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        users: [
          expect.objectContaining({
            id: ownerId,
            nickname: 'chatmemberowner',
          }),
        ],
        nextCursor: ownerId,
        limit: 1,
        hasMore: true,
      });
      expect(body.users[0]).not.toHaveProperty('email');
      expect(body.users[0]).not.toHaveProperty('password');

      const nextPage = await request(app.getHttpServer())
        .get(`/chats/${groupChatId}/users?limit=1&cursor=${ownerId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(200);

      expect(nextPage.body.users[0]).toEqual(
        expect.objectContaining({
          id: memberId,
          nickname: 'chatmemberuser',
        }),
      );
    });
  });

  describe('POST /chats/:chatId/users/:userId - Should add a user to chat', () => {
    it('POST /chats/:chatId/users/:userId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/users/${invitedUserId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /chats/:chatId/users/:userId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /chats/:chatId/users/:userId - 400 BAD REQUEST - Should return 400 because ids are invalid', async () => {
      await request(app.getHttpServer())
        .post('/chats/invalid/users/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/:chatId/users/:userId - 400 BAD REQUEST - Should only allow adding users to group chats', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${privateChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('POST /chats/:chatId/users/:userId - 404 NOT FOUND - Should return 404 if chat does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/chats/999999999/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('POST /chats/:chatId/users/:userId - 404 NOT FOUND - Should return 404 if user does not exist', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/users/999999999`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('POST /chats/:chatId/users/:userId - 201 CREATED - Should add user to group chat', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(201);

      expect(body[0]).toEqual(
        expect.objectContaining({
          chatId: groupChatId,
          userId: invitedUserId,
          role: ChatRole.MEMBER,
        }),
      );
    });

    it('POST /chats/:chatId/users/:userId - 409 CONFLICT - Should return 409 if user is already a participant', async () => {
      await request(app.getHttpServer())
        .post(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(409);
    });
  });

  describe('PATCH /chats/:chatId/users/:userId/role - Should update user role', () => {
    it('PATCH /chats/:chatId/users/:userId/role - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${memberId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${memberId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 400 BAD REQUEST - Should return 400 because ids are invalid', async () => {
      await request(app.getHttpServer())
        .patch('/chats/invalid/users/invalid/role')
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 400 BAD REQUEST - Should return 400 because role is invalid', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${memberId}/role`)
        .send({ role: 'INVALID' })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 403 FORBIDDEN - Should return 403 because user is not the owner', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${invitedUserId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 404 NOT FOUND - Should return 404 if user is not a participant', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${outsiderId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 404 NOT FOUND - Should return 404 if chat doesnt exist', async () => {
      await request(app.getHttpServer())
        .patch(`/chats/999999999/users/${outsiderId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('PATCH /chats/:chatId/users/:userId/role - 200 OK - Should update user role', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/chats/${groupChatId}/users/${memberId}/role`)
        .send({ role: ChatRole.MODERATOR })
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        chatId: groupChatId,
        userId: memberId,
        role: ChatRole.MODERATOR,
        isPinned: false,
        connectedAt: expect.any(String),
      });
    });
  });

  describe('DELETE /chats/:chatId/users/:userId - Should remove a user from chat', () => {
    it('DELETE /chats/:chatId/users/:userId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/users/${invitedUserId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /chats/:chatId/users/:userId - 403 FORBIDDEN - Should return 403 because user is not verified', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${unverifiedAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('DELETE /chats/:chatId/users/:userId - 400 BAD REQUEST - Should return 400 because ids are invalid', async () => {
      await request(app.getHttpServer())
        .delete('/chats/invalid/users/invalid')
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId/users/:userId - 400 BAD REQUEST - Should only allow removing users from group chats', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${privateChatId}/users/${memberId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(400);
    });

    it('DELETE /chats/:chatId/users/:userId - 403 FORBIDDEN - Should return 403 because user is not the owner', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(403);
    });

    it('DELETE /chats/:chatId/users/:userId - 404 NOT FOUND - Should return 404 because user is not participant of chat', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/users/9999999`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(404);
    });

    it('DELETE /chats/:chatId/users/:userId - 404 NOT FOUND - Should return 404 because chat doesnt exist', async () => {
      await request(app.getHttpServer())
        .delete(`/chats/9999999/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${memberAccessToken}`])
        .expect(404);
    });

    it('DELETE /chats/:chatId/users/:userId - 200 OK - Should remove user from group chat', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/chats/${groupChatId}/users/${invitedUserId}`)
        .set('Cookie', [`access_token=${ownerAccessToken}`])
        .expect(200);

      expect(body[0]).toEqual(
        expect.objectContaining({
          chatId: groupChatId,
          userId: invitedUserId,
          role: ChatRole.MEMBER,
        }),
      );
      expect(body[1]).toEqual({ membersCount: 1 });
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
