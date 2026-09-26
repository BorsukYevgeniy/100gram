import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import authConfig from '../src/config/auth.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import {
  unauthorizedResponse,
  userNotFoundResponse,
} from './const/response.const';

describe('BlockedUserController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;
  let accessToken: string;
  let blockerId: number;
  let blockedId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        AuthModule,
        ConfigModule.forRoot({ envFilePath: '.env.test', isGlobal: true }),
        LoggerModule.forRootAsync({
          imports: [ConfigModule.forFeature(pinoConfig)],
          inject: [pinoConfig.KEY],
          useFactory: (c: ConfigType<typeof pinoConfig>) => c,
        }),
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

    await prisma.blockedUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.init();

    const hashedPassword = hashSync('password', passwordSalt);
    const [blocker, blocked] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'blocked-user-owner@gmail.com',
          password: hashedPassword,
          nickname: 'blockedowner',
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: 'blocked-user-target@gmail.com',
          password: hashedPassword,
          nickname: 'blockedtarget',
        },
        select: { id: true },
      }),
    ]);

    blockerId = blocker.id;
    blockedId = blocked.id;

    const { headers } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'blocked-user-owner@gmail.com', password: 'password' });

    accessToken = headers['set-cookie'][0].split('=')[1].split(';')[0];
  });

  describe('POST /users/block/:blockedId - Should block a user', () => {
    it('POST /users/block/:blockedId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/users/block/${blockedId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /users/block/:blockedId - 400 BAD REQUEST - Should return 400 because blockedId is not a number', async () => {
      await request(app.getHttpServer())
        .post('/users/block/invalid')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(400);
    });

    it('POST /users/block/:blockedId - 400 BAD REQUEST - Should not allow blocking yourself', async () => {
      await request(app.getHttpServer())
        .post(`/users/block/${blockerId}`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(400);
    });

    it('POST /users/block/:blockedId - 201 CREATED - Should block the user', async () => {
      const { body } = await request(app.getHttpServer())
        .post(`/users/block/${blockedId}`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(201);

      expect(body).toEqual({
        blockerId,
        blockedId,
        blockedAt: expect.any(String),
      });
    });
  });

  describe('GET /users/me/blocked - Should return blocked users', () => {
    it('GET /users/me/blocked - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/users/me/blocked')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /users/me/blocked - 200 OK - Should return an empty list', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/users/me/blocked')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);

      expect(body).toEqual([
        {
          blockerId,
          blockedId,
          blockedAt: expect.any(String),
        },
      ]);
    });
  });

  describe('DELETE /users/block/:blockedId - Should unblock a user', () => {
    it('DELETE /users/block/:blockedId - 401 UNAUTHORIZED - Should return 401 because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/block/${blockedId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /users/block/:blockedId - 400 BAD REQUEST - Should return 400 because blockedId is not a number', async () => {
      await request(app.getHttpServer())
        .delete('/users/block/invalid')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(400);
    });

    it('DELETE /users/block/:blockedId - 400 BAD REQUEST - Should not allow unblocking yourself', async () => {
      await request(app.getHttpServer())
        .delete(`/users/block/${blockerId}`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(400);
    });

    it('DELETE /users/block/:blockedId - 200 OK - Should unblock the user', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/block/${blockedId}`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(200);

      expect(body).toEqual({
        blockerId,
        blockedId,
        blockedAt: expect.any(String),
      });
    });

    it('DELETE /users/block/:blockedId - 404 NOT FOUND - Should return 404 when the block does not exist', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/block/${blockedId}`)
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });
  });

  afterAll(async () => {
    await prisma.blockedUser.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.user.deleteMany({});

    await app.close();
  });
});
