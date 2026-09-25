import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

import { hashSync } from 'bcryptjs';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { Provider, Role } from '../generated/prisma/enums';
import authConfig from '../src/config/auth.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import {
  adminForbiddenResponse,
  unauthorizedResponse,
  userNotFoundResponse,
} from './const/response.const';

const userResponse = {
  createdAt: expect.any(String),
  nickname: 'user',
  id: expect.any(Number),
  role: Role.USER,
  isVerified: false,
  verifiedAt: null,
  avatarName: null,
  description: null,
  provider: Provider.LOCAL,
};
const adminResponse = { ...userResponse, role: Role.ADMIN, isVerified: true };

describe('UserController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwordSalt: number;

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

    await app.init();
  }, 10_000);

  let adminAccessToken: string, userAccessToken: string;
  let userId: number;

  beforeAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});

    const hashedPassword = hashSync('password', passwordSalt);

    const [user] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'user@gmail.com',
          password: hashedPassword,
          nickname: 'user',
          isVerified: false,
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: 'admin@gmail.com',
          password: hashedPassword,
          nickname: 'admin',
          role: 'ADMIN',
          isVerified: true,
        },
        select: { id: true },
      }),
    ]);

    const [{ headers: adminHeaders }, { headers: userHeaders }] =
      await Promise.all([
        //Login as admin
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'admin@gmail.com', password: 'password' }),

        //Login as user
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user@gmail.com', password: 'password' }),
      ]);

    adminAccessToken = adminHeaders['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    userAccessToken = userHeaders['set-cookie'][0].split('=')[1].split(';')[0];

    userId = user.id;
  }, 15_000);

  describe('GET /users/:userId - Should return user by id', () => {
    it('GET /users/:userId - 200 OK - Should return user searched by id', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(200);

      expect(body).toEqual(userResponse);
    });

    it('GET /users/:userId - 400 BAD REQUEST - Should return 400 code because user id isnt number', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId.toString().concat('abc')}`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(400);
    });

    it('GET /users/:userId - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('GET /users/:userId - 404 NOT FOUND - Should return 404 code because user not founded', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/${userId - 3}`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });
  });

  describe('GET /users/me - Should return me', () => {
    it('GET /users/me - 200 OK - Should return me', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/users/me')
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(200);

      expect(body).toEqual(userResponse);
    });

    it('GET /users/:userId - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/users/me`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });
  });

  describe('PATCH /users/assign-admin/:userId - Should assign user to admin', () => {
    it('PATCH /users/assign-admin/:userId - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/users/assign-admin/${userId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /users/assign-admin/:userId - 403 FORBIDDEN - Should return 403 code because user doesnt have a permissin to setting new admin', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/users/assign-admin/${userId}`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(403);

      expect(body).toEqual(adminForbiddenResponse);
    });

    it('PATCH /users/assign-admin/:userId - 404 NOT FOUND - Should return 404 code because user not found', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/users/assign-admin/${userId - 2}`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });

    it('PATCH /users/assign-admin/:userId - 409 CONFLICT - Should return 409 code because user isnt verified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/users/assign-admin/${userId}`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(409);

      expect(body).toEqual({
        error: 'Conflict',
        message: 'Admin must be a verified user',
        statusCode: 409,
      });
    });

    it('PATCH /users/assign-admin/:userId - 400 BAD REQUEST - Should return 400 code because user id isnt number', async () => {
      await request(app.getHttpServer())
        .patch('/users/assign-admin/userId')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(400);
    });

    it('PATCH /users/assign-admin/:userId - 200 OK - Should assign user to admin', async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      const { body } = await request(app.getHttpServer())
        .patch(`/users/assign-admin/${userId}`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200);

      expect(body).toEqual(adminResponse);
    });
  });

  describe('DELETE /users/:userId - Should delete user by id', () => {
    it('DELETE /users/:userId - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /users/:userId - 403 FORBIDDEN - Should return 403 code because user doesnt have a permissin to delete user by id', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(403);

      expect(body).toEqual(adminForbiddenResponse);
    });

    it('DELETE /users/:userId - 400 BAD REQUEST - Should return 400 code because user id isnt number', async () => {
      await request(app.getHttpServer())
        .delete('/users/userId')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(400);
    });

    it('DELETE /users/:userId - 204 OK - Should delete user by id', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200);

      expect(body).toEqual(adminResponse); // There is adminResponse because now response have save the same fileds with admin response
    });

    it('DELETE /users/:userId - 404 NOT FOUND - Should return 404 HTTP code', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });
  });

  describe('DELETE /users/me - Should delete user by himself', () => {
    it('DELETE /users/me - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete('/users/me')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /users/me - 200 OK - Should delete user by himself', async () => {
      const { body } = await request(app.getHttpServer())
        .delete('/users/me')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(200);

      expect(body).toEqual({ ...adminResponse, nickname: 'admin' });
    });

    it('DELETE /users/me - 404 NOT FOUND - Should return 404 code because user not founded', async () => {
      const { body } = await request(app.getHttpServer())
        .delete('/users/me')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(404);

      expect(body).toEqual(userNotFoundResponse);
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});
    await app.close();
  });
});
