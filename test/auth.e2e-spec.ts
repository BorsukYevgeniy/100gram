import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import databaseConfig from '../src/config/database.config';
import pinoConfig from '../src/config/pino.config';
import { PrismaModule } from '../src/infra/prisma/prisma.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { LoginDto } from '../src/modules/auth/dto/login.dto';
import { CreateUserDto } from '../src/modules/user/dto/create-user.dto';

describe('AuthController (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
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

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.useLogger(false);

    await prisma.user.deleteMany();
    await prisma.token.deleteMany();

    await app.init();
  }, 10_000);

  describe('POST /auth/register - Should register a new user', () => {
    it.each<[string, 201 | 400, CreateUserDto]>([
      [
        'POST /auth/register - 201 CREATED - Should register a new user',
        201,
        {
          email: 'user@gmail.com',
          nickname: 'user',
          password: 'password',
        },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because user already exists',
        400,
        {
          email: 'user@gmail.com',
          nickname: 'user',
          password: 'password',
        },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because email not valid',
        400,
        { email: 'user', nickname: 'user', password: 'password' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because nickname not valid',
        400,
        { email: 'user1@gmail.com', nickname: 'us', password: 'password' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because password not valid',
        400,
        { email: 'user1@gmail.com', nickname: 'user1', password: 'user' },
      ],
      [
        'POST /auth/register - 400 BAD REQUEST - Should return 400 http code because data not valid',
        400,
        { email: 'user', nickname: 'us', password: 'user' },
      ],
    ])('%s', async (_, statusCode, CreateUserDto) => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/register')
        .send(CreateUserDto)
        .expect(statusCode);

      if (statusCode === 201) {
        expect(headers['set-cookie']).toEqual([
          expect.any(String),
          expect.any(String),
        ]);
      }
    });
  });

  let accessToken: string, refreshToken: string;
  describe('POST /auth/login - Should login a user', () => {
    it.each<[string, 200 | 400 | 404, LoginDto]>([
      [
        'POST /auth/login - 200 OK - Should login a user',
        200,
        { email: 'user@gmail.com', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because client send invalid credentials',
        400,
        { email: 'user1@gmail.com', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because email not valid',
        400,
        { email: 'use', password: 'password' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because password not valid',
        400,
        { email: 'user1@gmail.com', password: 'pass' },
      ],
      [
        'POST /auth/login - 400 BAD REQUEST - Should return 400 HTTP code because data not valid',
        400,
        { email: 'user', password: 'pass' },
      ],
    ])('%s', async (_, statusCode, loginUserDto) => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginUserDto)
        .expect(statusCode);

      if (statusCode === 200) {
        const cookies = headers['set-cookie'];

        accessToken = cookies[0].split('=')[1].split(';')[0];
        refreshToken = cookies[1].split('=')[1].split(';')[0];
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('200 OK - Should refresh pair of tokens', async () => {
      const { headers } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `refresh_token=${refreshToken}`)
        .expect(200);

      refreshToken = headers['set-cookie'][1].split('=')[1].split(';')[0];
    });

    it('401 UNAUTHORIZED - Should return 401 code because token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=1')
        .expect(401);
    });
  });

  describe('POST /auth/logout - Should logout a user', () => {
    it('POST /auth/logout - 200 OK - Should logout a user', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [
          `refresh_token=${refreshToken}; access_token=${accessToken}`,
        ])
        .expect(204);
    });

    it('401 UNAUTHORIZED - Should return 401 code because client is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', 'refresh_token=1')
        .expect(401);
    });
  });

  describe('POST /auth/logout-all - Should logout a user from all devices', () => {
    it('POST /auth/logout-all - 200 OK - Should logout a user from all devices', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', [`access_token=${accessToken}`])
        .expect(204);
    });

    it('401 UNAUTHORIZED - Should return 401 code because client is unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout-all')
        .set('Cookie', 'access_token=1')
        .expect(401);
    });
  });

  describe('POST /auth/verify', () => {
    it('should verify user', async () => {
      const { verificationCode } = await prisma.user.findUnique({
        where: { email: 'user@gmail.com' },
      });

      await request(app.getHttpServer())
        .post(`/auth/verify/${verificationCode}`)
        .expect(200);
    });

    it('should return 400 if user is already verified', async () => {
      const { verificationCode } = await prisma.user.findUnique({
        where: { email: 'user@gmail.com' },
      });

      await request(app.getHttpServer())
        .post(`/auth/verify/${verificationCode}`)
        .expect(400);
    });

    it('should return 404 if user does not exist', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.token.deleteMany();
    await app.close();
  });
});
