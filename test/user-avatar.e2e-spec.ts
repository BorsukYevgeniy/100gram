import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import authConfig from '../src/config/auth.config';
import databaseConfig from '../src/config/database.config';
import pinoConfig from '../src/config/pino.config';
import { MinioService } from '../src/infra/minio/minio.service';
import { PrismaModule } from '../src/infra/prisma/prisma.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import {
  adminForbiddenResponse,
  unauthorizedResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('UserAvatarController (e2e)', () => {
  let app: NestExpressApplication;
  let minio: MinioService;
  let prisma: PrismaService;
  let passwordSalt: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UserModule,
        AuthModule,
        PrismaModule,
        LoggerModule.forRootAsync({
          imports: [ConfigModule.forFeature(pinoConfig)],
          inject: [pinoConfig.KEY],
          useFactory: (c: ConfigType<typeof pinoConfig>) => c,
        }),
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        ConfigModule.forFeature(databaseConfig),
      ],
      providers: [PrismaService],
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

    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.file.deleteMany({});

    await app.init();
  }, 10_000);

  let adminAccessToken: string;
  let userAccessToken: string;
  let unverUserAccessToken: string;
  let userId: number;
  let avatarName: string;

  beforeAll(async () => {
    const hashedPassword = hashSync('password', passwordSalt);

    const [user, admin, unverUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'user-avatar@gmail.com',
          password: hashedPassword,
          nickname: 'avataruser',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'admin-avatar@gmail.com',
          password: hashedPassword,
          nickname: 'avataradmin',
          role: 'ADMIN',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'unver-avatar@gmail.com',
          password: hashedPassword,
          nickname: 'unveravatar',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
    ]);

    const [
      { headers: adminHeaders },
      { headers: userHeaders },
      { headers: unverUserHeaders },
    ] = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: admin.email, password: 'password' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: user.email, password: 'password' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: unverUser.email, password: 'password' }),
    ]);

    adminAccessToken = adminHeaders['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    userAccessToken = userHeaders['set-cookie'][0].split('=')[1].split(';')[0];
    unverUserAccessToken = unverUserHeaders['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    userId = user.id;
  });

  describe('PATCH /users/me/avatar - user avatar', () => {
    it('PATCH /users/me/avatar - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .attach('avatar', Buffer.from('avatar'))
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('PATCH /users/me/avatar - 403 FORBIDDEN - Should return 403 code because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${unverUserAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('PATCH /users/me/avatar - 400 BAD REQUEST - Should return 400 code because file extension is invalid', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.txt')
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(400);
    });

    it('PATCH /users/me/avatar - 200 OK - Should update current user avatar', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(200);

      expect(body).toEqual({
        avatarUrl: expect.any(String),
      });

      avatarName = body.avatarUrl.split('/').pop();
    });
  });

  describe('DELETE /users/:userId/avatar - Should delete user avatar', () => {
    it('DELETE /users/:userId/avatar - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}/avatar`)
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /users/:userId/avatar - 403 FORBIDDEN - Should return 403 code because user isnt an admin', async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/users/${userId}/avatar`)
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(403);

      expect(body).toEqual(adminForbiddenResponse);
    });

    it('DELETE /users/:userId/avatar - 400 BAD REQUEST - Should return 400 code because user id isnt number', async () => {
      await request(app.getHttpServer())
        .delete('/users/invalid/avatar')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(400);
    });

    it('DELETE /users/:userId/avatar - 204 NO CONTENT - Should delete user avatar', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}/avatar`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(204);
    });

    it('DELETE /users/:userId/avatar - 400 BAD REQUEST - Should return 400 code because user has no avatar', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}/avatar`)
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(400);
    });
  });

  describe('DELETE /users/me/avatar - Should delete current user avatar', () => {
    it('DELETE /users/me/avatar - 401 UNAUTHORIZED - Should return 401 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('DELETE /users/me/avatar - 400 BAD REQUEST - Should return 400 code because user has no avatar', async () => {
      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Cookie', [`access_token=${userAccessToken}`])
        .expect(400);
    });

    it('DELETE /users/me/avatar - 204 NOT CONTENT - Should delete my avatar', async () => {
      await request(app.getHttpServer())
        .patch('/users/me/avatar')
        .attach('avatar', Buffer.from('avatar'), 'avatar.jpg')
        .set('Cookie', [`access_token=${adminAccessToken}`]);

      await request(app.getHttpServer())
        .delete('/users/me/avatar')
        .set('Cookie', [`access_token=${adminAccessToken}`])
        .expect(204);
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.file.deleteMany({});

    await minio.delete(`avatars/users/${avatarName}`);

    await app.close();
  });
});
