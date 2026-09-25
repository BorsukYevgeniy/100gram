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
import { FileModule } from '../src/modules/file/file.module';
import {
  unauthorizedResponse,
  verifiedForbiddenResponse,
} from './const/response.const';

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  let minio: MinioService;
  let prisma: PrismaService;
  let passwordSalt: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        FileModule,
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

    const authConf = app.get<ConfigType<typeof authConfig>>(authConfig.KEY);

    passwordSalt = authConf.passwordSalt;

    prisma = app.get<PrismaService>(PrismaService);
    minio = app.get<MinioService>(MinioService);

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
  });

  let verUserAccessToken: string, unverUserAccessToken: string;
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});

    const hashedPassword = hashSync('password', passwordSalt);

    const [unverUser, verUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'unveruser@gmail.com',
          password: hashedPassword,
          nickname: 'unveruser',
          isVerified: false,
        },
        select: { id: true, email: true },
      }),
      prisma.user.create({
        data: {
          email: 'veruser@gmail.com',
          password: hashedPassword,
          nickname: 'veruser',
          isVerified: true,
        },
        select: { id: true, email: true },
      }),
    ]);

    const [{ headers: verUserHeaders }, { headers: unverUserHeaders }] =
      await Promise.all([
        //Login as verified user
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: verUser.email, password: 'password' }),

        //Login as unverified user
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: unverUser.email, password: 'password' }),
      ]);

    verUserAccessToken = verUserHeaders['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    unverUserAccessToken = unverUserHeaders['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
  });

  let fileName: string;
  describe('POST /files/upload - Should upload a file in server', () => {
    it('POST /files/upload - 401 UNAUTHORIZED -  Should return 403 code because user is unauthorized', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/files/upload')
        .attach('files', Buffer.from('123'))
        .expect(401);

      expect(body).toEqual(unauthorizedResponse);
    });

    it('POST /files/upload - 403 FORBIDDEN - Should return 403 code because user is unverified', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/files/upload')
        .attach('files', Buffer.from('123'))
        .set('Cookie', [`access_token=${unverUserAccessToken}`])
        .expect(403);

      expect(body).toEqual(verifiedForbiddenResponse);
    });

    it('POST /files/upload - 201 CREATED - Should upload a file in server', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/files/upload')
        .attach('files', Buffer.from('123'), 'test.jpg')
        .set('Cookie', [`access_token=${verUserAccessToken}`])
        .expect(201);

      fileName = body[0].name;
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.token.deleteMany({});
    await prisma.file.deleteMany({});

    await minio.delete(`/attachments/${fileName}`);

    await app.close();
  });
});
